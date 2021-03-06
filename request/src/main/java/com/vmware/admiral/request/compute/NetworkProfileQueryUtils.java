/*
 * Copyright (c) 2017 VMware, Inc. All Rights Reserved.
 *
 * This product is licensed to you under the Apache License, Version 2.0 (the "License").
 * You may not use this product except in compliance with the License.
 *
 * This product may include a number of subcomponents with separate copyright notices
 * and license terms. Your use of these subcomponents is subject to the terms and
 * conditions of the subcomponent's license, as noted in the LICENSE file.
 */

package com.vmware.admiral.request.compute;

import static com.vmware.admiral.request.utils.RequestUtils.FIELD_NAME_CONTEXT_ID_KEY;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.apache.commons.lang3.StringUtils;

import com.vmware.admiral.common.util.QueryUtil;
import com.vmware.admiral.compute.content.ConstraintConverter;
import com.vmware.admiral.compute.network.ComputeNetworkDescriptionService.ComputeNetworkDescription;
import com.vmware.admiral.compute.network.ComputeNetworkDescriptionService.NetworkType;
import com.vmware.admiral.compute.network.ComputeNetworkService.ComputeNetwork;
import com.vmware.admiral.compute.profile.NetworkProfileService.NetworkProfile.IsolationSupportType;
import com.vmware.admiral.compute.profile.ProfileService.ProfileState;
import com.vmware.admiral.compute.profile.ProfileService.ProfileStateExpanded;
import com.vmware.photon.controller.model.Constraint.Condition;
import com.vmware.photon.controller.model.adapters.util.Pair;
import com.vmware.photon.controller.model.query.QueryUtils;
import com.vmware.photon.controller.model.resources.ComputeDescriptionService.ComputeDescription;
import com.vmware.photon.controller.model.resources.ComputeService.ComputeState;
import com.vmware.photon.controller.model.resources.NetworkInterfaceDescriptionService.NetworkInterfaceDescription;
import com.vmware.photon.controller.model.resources.SubnetService.SubnetState;
import com.vmware.xenon.common.DeferredResult;
import com.vmware.xenon.common.LocalizableValidationException;
import com.vmware.xenon.common.Operation;
import com.vmware.xenon.common.ServiceHost;
import com.vmware.xenon.common.UriUtils;
import com.vmware.xenon.services.common.QueryTask;
import com.vmware.xenon.services.common.QueryTask.Query.Builder;

public class NetworkProfileQueryUtils {
    public static final String NO_NIC_VM = "__noNICVM";

    /** Collect profiles that can satisfy all networks associated with VM. */
    public static void getProfilesForComputeNics(ServiceHost host, URI referer,
            List<String> tenantLinks, String contextId, ComputeDescription computeDesc,
            BiConsumer<List<String>, Throwable> consumer) {
        if (computeDesc.networkInterfaceDescLinks == null || computeDesc.networkInterfaceDescLinks
                .isEmpty()) {
            consumer.accept(null, null);
            return;
        }
        getContextComputeNetworks(host, referer, tenantLinks, contextId, consumer,
                (retrievedNetworks) -> {
                    getNetworkProfiles(host, referer, computeDesc,
                            retrievedNetworks, consumer);
                });
    }

    /** Select Subnet that is applicable for compute network interface. */
    public static void getSubnetForComputeNic(ServiceHost host, URI referer,
            List<String> tenantLinks, String contextId, NetworkInterfaceDescription nid,
            ProfileStateExpanded profileState,
            BiConsumer<Pair<ComputeNetwork, SubnetState>, Throwable> consumer) {
        // Get all context networks
        getContextComputeNetworks(host, referer, tenantLinks, contextId,
                (contextNetworks, e) -> {
                    if (e != null) {
                        consumer.accept(null, e);
                        return;
                    }
                },
                (retrievedNetworks) -> {
                    // Find compute network for network interface
                    ComputeNetwork computeNetwork = retrievedNetworks.get(nid.name);
                    if (computeNetwork == null) {
                        consumer.accept(null, getContextNetworkNotFoundError(nid.name));
                        return;
                    }

                    List<String> constraints = new ArrayList<String>();

                    host.sendWithDeferredResult(
                            // Get network description of compute network
                            Operation.createGet(host, computeNetwork.descriptionLink)
                                    .setReferer(referer), ComputeNetworkDescription.class)
                            .thenCompose(networkDescription -> {
                                DeferredResult<Pair<ComputeNetwork, SubnetState>> result;
                                if (networkDescription.networkType == NetworkType.ISOLATED) {
                                    result = getSubnetForIsolatedNetwork(host, profileState,
                                            computeNetwork, referer)
                                            .thenApply(subnetState ->
                                                    Pair.of(computeNetwork, subnetState));
                                } else {
                                     // Validate network description constraints against selected profile
                                    Map<Condition, String> placementConstraints = TagConstraintUtils
                                            .extractPlacementTagConditions(
                                                    networkDescription.constraints,
                                                    networkDescription.tenantLinks);
                                    if (placementConstraints != null) {
                                        constraints.addAll(placementConstraints.keySet().stream()
                                                .map(c -> ConstraintConverter.encodeCondition(c).tag)
                                                .collect(Collectors.toList()));
                                    }
                                    Stream<SubnetState> subnetsStream = TagConstraintUtils
                                            .filterByConstraints(
                                                    placementConstraints,
                                                    profileState.networkProfile.subnetStates
                                                            .stream(),
                                                    s -> combineTags(profileState, s),
                                                    null);

                                    if (computeNetwork.networkType == NetworkType.PUBLIC) {
                                        subnetsStream = subnetsStream.filter(s -> Boolean.TRUE
                                                .equals(s.supportPublicIpAddress));
                                    }

                                    SubnetState subnet = subnetsStream.findAny().orElse(null);
                                    result = DeferredResult.completed(
                                            Pair.of(computeNetwork, subnet));
                                }
                                return result;
                            })
                            .whenComplete((pair, ex) -> {
                                if (ex != null) {
                                    consumer.accept(null, ex);
                                } else if (pair == null || pair.right == null) {
                                    consumer.accept(null, new LocalizableValidationException(
                                            String.format(
                                                    "Selected profile '%s' doesn't satisfy network '%s' constraints %s.",
                                                    profileState.name, nid.name, constraints),
                                            "compute.network.constraints.not.satisfied.by.profile",
                                            profileState.name, nid.name, constraints));
                                } else {
                                    consumer.accept(pair, null);
                                }
                            });
                });
    }

    private static DeferredResult<SubnetState> getSubnetForIsolatedNetwork(ServiceHost host,
            ProfileStateExpanded profile, ComputeNetwork computeNetwork, URI referer) {

        if (profile.networkProfile.isolationType != IsolationSupportType
                .SUBNET) {
            // Environment doesn't support new subnetc ase.
            return DeferredResult.completed(null);
        }

        if (computeNetwork.subnetLink == null) {
            // Template subnet should be already allocated by
            // ComputeNetworkAllocationTaskService.
            return DeferredResult.completed(null);
        } else {
            // There is already allocated template subnet.
            return host.sendWithDeferredResult(
                    Operation.createGet(host, computeNetwork.subnetLink)
                            .setReferer(referer),
                    SubnetState.class);
        }
    }

    /** Get profiles that can be used to provision compute networks. */
    public static void getProfilesForNetworkDescription(ServiceHost host, URI referer,
            ComputeNetworkDescription networkDescription,
            BiConsumer<List<String>, Throwable> consumer) {
        selectProfilesForNetworkDescriptionTenant(host, referer, networkDescription,
                networkDescription.tenantLinks, consumer);
    }

    private static void selectProfilesForNetworkDescriptionTenant(ServiceHost host, URI referer,
            ComputeNetworkDescription networkDescription,
            List<String> tenantLinks, BiConsumer<List<String>, Throwable> consumer) {
        Set<String> profileLinks = new HashSet<>();
        QueryTask.Query.Builder builder = QueryTask.Query.Builder.create()
                .addKindFieldClause(ProfileState.class);
        if (tenantLinks == null || tenantLinks.isEmpty()) {
            builder.addClause(QueryUtil.addTenantClause(tenantLinks));
        }

        QueryUtils.QueryByPages<ProfileState> query =
                new QueryUtils.QueryByPages<>(host, builder.build(), ProfileState.class,
                        QueryUtil.getTenantLinks(tenantLinks));
        query.queryLinks(profileLink -> profileLinks.add(profileLink))
                .whenComplete(((v, e) -> {
                    if (e != null) {
                        consumer.accept(null, e);
                        return;
                    }
                    // If there are no profiles defined for the tenant, get system network profiles
                    if (profileLinks.isEmpty() && tenantLinks != null && !tenantLinks
                            .isEmpty()) {
                        selectProfilesForNetworkDescriptionTenant(host, referer,
                                networkDescription, null, consumer);
                        return;
                    }

                    // Get expanded profiles
                    DeferredResult<List<ProfileStateExpanded>> result = DeferredResult.allOf(
                            profileLinks.stream()
                                    .map(profileLink -> {
                                        Operation op = Operation.createGet(
                                                ProfileStateExpanded.buildUri(UriUtils.buildUri(
                                                        host, profileLink)))
                                                .setReferer(referer);

                                        return host.sendWithDeferredResult(op,
                                                ProfileStateExpanded.class);
                                    })
                                    .collect(Collectors.toList()));

                    result.whenComplete((all, ex) -> {
                        if (ex != null) {
                            consumer.accept(null, ex);
                            return;
                        }
                        // Filter profiles based on network constraints
                        Map<Condition, String> placementConstraints = TagConstraintUtils
                                .extractPlacementTagConditions(networkDescription.constraints,
                                        networkDescription.tenantLinks);

                        List<String> selectedProfiles;
                        if (networkDescription.networkType == NetworkType.ISOLATED) {
                            // Filter environments that match the tags and support isolation.
                            selectedProfiles = TagConstraintUtils
                                    .filterByConstraints(
                                            placementConstraints,
                                            all.stream(),
                                            env -> combineTags(env),
                                            null)
                                    .filter(env -> env.networkProfile.isolationType != IsolationSupportType.NONE)
                                    .map(env -> env.documentSelfLink)
                                    .distinct()
                                    .collect(Collectors.toList());
                        } else {
                            Stream<Pair<ProfileStateExpanded, SubnetState>> pairs = all.stream()
                                    .flatMap(profile -> profile.networkProfile.subnetStates.stream().map(
                                            s -> Pair.of(profile, s)));

                            if (networkDescription.networkType == NetworkType.PUBLIC) {
                                pairs = pairs.filter(p -> p.right.supportPublicIpAddress != null ?
                                      p.right.supportPublicIpAddress : false);
                            }

                            selectedProfiles = TagConstraintUtils
                                    .filterByConstraints(
                                            placementConstraints,
                                            pairs,
                                            p -> combineTags(p.left, p.right),
                                            null)
                                    .map(p -> p.left.documentSelfLink)
                                    .distinct()
                                    .collect(Collectors.toList());
                        }
                        if (placementConstraints != null && !placementConstraints.isEmpty()
                                && selectedProfiles.isEmpty()) {
                            List<String> constraints = placementConstraints.keySet().stream()
                                    .map(c -> ConstraintConverter.encodeCondition(c).tag)
                                    .collect(Collectors.toList());
                            consumer.accept(null, new LocalizableValidationException(
                                    String.format(
                                            "Could not find any profiles to satisfy all of network '%s' constraints %s.",
                                            networkDescription.name, constraints),
                                    "compute.network.no.profiles.satisfy.constraints",
                                    networkDescription.name, constraints));
                        } else {
                            consumer.accept(selectedProfiles, null);
                        }
                    });
                }));
    }

    private static void getNetworkProfiles(ServiceHost host, URI referer,
            ComputeDescription computeDescription,
            Map<String, ComputeNetwork> contextComputeNetworks,
            BiConsumer<List<String>, Throwable> consumer) {
        DeferredResult<List<ComputeNetwork>> result = DeferredResult.allOf(
                computeDescription.networkInterfaceDescLinks.stream()
                        .map(nicDescLink -> {
                            Operation op = Operation.createGet(host, nicDescLink)
                                    .setReferer(referer);

                            return host.sendWithDeferredResult(op,
                                    NetworkInterfaceDescription.class);
                        })
                        .map(nidr -> nidr.thenApply(nid -> {
                            if (nid.customProperties != null
                                    && nid.customProperties.containsKey(NO_NIC_VM)) {
                                // VM was requested without NIC then simply return a no constraint
                                // compute network
                                return new ComputeNetwork();
                            }

                            ComputeNetwork computeNetwork = contextComputeNetworks.get(nid.name);
                            if (computeNetwork == null) {
                                throw getContextNetworkNotFoundError(nid.name);
                            }
                            return computeNetwork;
                        }))
                        .collect(Collectors.toList()));

        result.whenComplete((all, e) -> {
            if (e != null) {
                consumer.accept(null, e);
                return;
            }

            // Remove networks that don't have any constraints
            all.removeIf(cn -> cn.profileLinks == null || cn.profileLinks.isEmpty());
            if (all.isEmpty()) {
                consumer.accept(null, null);
                return;
            }
            List<String> profileLinks = all.get(0).profileLinks;
            all.forEach(cn -> profileLinks.retainAll(cn.profileLinks));

            consumer.accept(profileLinks, null);
        });
    }

    public static void getContextComputeNetworks(ServiceHost host, URI referer,
            List<String> tenantLinks, String contextId, BiConsumer<List<String>, Throwable> consumer,
            Consumer<Map<String, ComputeNetwork>> callbackFunction) {
        Map<String, ComputeNetwork> contextNetworks = new HashMap<>();
        if (StringUtils.isBlank(contextId)) {
            callbackFunction.accept(contextNetworks);
            return;
        }

        // Get all ComputeNetworks that have the same context id
        List<ComputeNetwork> computeNetworks = new ArrayList<>();
        Builder builder = Builder.create()
                .addKindFieldClause(ComputeNetwork.class);
        builder.addCompositeFieldClause(ComputeState.FIELD_NAME_CUSTOM_PROPERTIES,
                FIELD_NAME_CONTEXT_ID_KEY, contextId);
        QueryUtils.QueryByPages<ComputeNetwork> query = new QueryUtils.QueryByPages<>(
                host,
                builder.build(), ComputeNetwork.class, tenantLinks);
        query.queryDocuments(ns -> computeNetworks.add(ns)).whenComplete((v, e) -> {
            if (e != null) {
                consumer.accept(null, e);
                return;
            }
            // Get ComputeNetworkDescription of every network
            List<DeferredResult<Pair<String, ComputeNetwork>>> list = computeNetworks
                    .stream()
                    .map(cn -> host.sendWithDeferredResult(
                            Operation.createGet(host, cn.descriptionLink).setReferer(referer),
                            ComputeNetworkDescription.class)
                            .thenApply(cnd -> Pair.of(cnd.name, cn)))
                    .collect(Collectors.toList());
            // Create a map of ComputeNetworkDescription.name to ComputeNetworkState
            DeferredResult.allOf(list).whenComplete((all, t) -> {
                all.forEach(p -> contextNetworks.put(p.left, p.right));
                callbackFunction.accept(contextNetworks);
            });
        });
    }

    private static LocalizableValidationException getContextNetworkNotFoundError(
            String networkInterfaceName) {
        return new LocalizableValidationException(
                String.format(
                        "Could not find context network component with name '%s'.",
                        networkInterfaceName),
                "compute.network.component.not.found", networkInterfaceName);
    }

    private static Set<String> combineTags(ProfileStateExpanded profile,
            SubnetState subnetState) {
        Set<String> tagLinks = combineTags(profile);

        if (subnetState.tagLinks != null) {
            tagLinks.addAll(subnetState.tagLinks);
        }

        return tagLinks;
    }

    private static Set<String> combineTags(ProfileStateExpanded profile) {
        Set<String> tagLinks = new HashSet<>();
        if (profile.tagLinks != null) {
            tagLinks.addAll(profile.tagLinks);
        }
        if (profile.networkProfile.tagLinks != null) {
            tagLinks.addAll(profile.networkProfile.tagLinks);
        }

        return tagLinks;
    }
}
