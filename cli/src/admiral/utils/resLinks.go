/*
 * Copyright (c) 2016 VMware, Inc. All Rights Reserved.
 *
 * This product is licensed to you under the Apache License, Version 2.0 (the "License").
 * You may not use this product except in compliance with the License.
 *
 * This product may include a number of subcomponents with separate copyright notices
 * and license terms. Your use of these subcomponents is subject to the terms and
 * conditions of the subcomponent's license, as noted in the LICENSE file.
 */

package utils

import (
	"fmt"
	"strings"
)

//Function to create links for the given IDs passed as parameters.
//Return slice of already created links.
func CreateResLinksForContainer(args []string) []string {
	link := "/resources/containers/"
	size := len(args)
	var links = make([]string, size)
	for i := range args {
		links[i] = link + args[i]
	}
	return links
}

//Function to create links for the given IDs passed as parameters.
//Return slice of already created links.
func CreateResLinksForHosts(id string) string {
	if id == "" {
		return ""
	}
	return "/resources/compute/" + id
}

//Function to create links for the given IDs passed as parameters.
//Return slice of already created links.
func CreateResLinksForApps(args []string) []string {
	link := "/resources/composite-components/"
	size := len(args)
	var links = make([]string, size)
	for i := range args {
		links[i] = link + args[i]
	}
	return links
}

//Function to create resource links from the provided ID as parameter.
func CreateResLinkForCerts(id string) string {
	if id == "" {
		return ""
	}
	return "/config/trust-certs/" + id
}

//Function to create resource links from the provided ID as parameter.
func CreateResLinkForCredentials(id string) string {
	if id == "" {
		return ""
	}
	return "/core/auth/credentials/" + id
}

//Function to create resource links from the provided ID as parameter.
func CreateResLinkForDeploymentPolicies(id string) string {
	if id == "" {
		return ""
	}
	return "/resources/deployment-policies/" + id
}

//Function to create resource links from the provided ID as parameter.
func CreateResLinkForResourcePool(id string) string {
	if id == "" {
		return ""
	}
	return "/resources/pools/" + id
}

//Function to create resource links from the provided ID as parameter.
func CreateResLinkForRegistry(id string) string {
	if id == "" {
		return ""
	}
	return "/config/registries/" + id
}

//Function to create resource links from the provided ID as parameter.
func CreateResLinksForPlacement(id string) string {
	if id == "" {
		return ""
	}
	return "/resources/group-placements/" + id
}

//Function to create resource links from the provided ID as parameter.
func CreateResLinkForProject(id string) string {
	if id == "" {
		return ""
	}
	return "/resources/groups/" + id
}

//Function to create resource links from the provided ID as parameter.
func CreateResLinkForRequest(id string) string {
	if id == "" {
		return ""
	}
	return "/request-status/" + id
}

//Function to create resource links from the provided ID as parameter.
func CreateResLinkForTemplate(id string) string {
	if id == "" {
		return ""
	}
	return "/resources/composite-descriptions/" + id
}

//Function to create resource links from the provided ID as parameter.
func CreateResLinkForBusinessGroup(id, tenant string) string {
	if id == "" {
		return ""
	}
	return fmt.Sprintf("/tenants/%s/groups/%s", tenant, id)
}

func CreateResLinkForTenant(tenant string) string {
	if tenant == "" {
		return ""
	}
	return fmt.Sprintf("/tenants/%s", tenant)
}

func CreateResLinkForContainerDescription(id string) string {
	if id == "" {
		return ""
	}
	return "/resources/container-descriptions/" + id
}

func CreateResLinkForTag(id string) string {
	if id == "" {
		return ""
	}
	return "/resources/tags/" + id
}

func CreateResLinkForPlacementZone(id string) string {
	if id == "" {
		return ""
	}
	if strings.HasPrefix(id, "/") {
		return "/resources/elastic-placement-zones-config" + id
	}
	return "/resources/elastic-placement-zones-config/" + id
}

func CreateResLinkForEndpoint(id string) string {
	if id == "" {
		return ""
	}
	return "/resources/endpoints/" + id
}

func CreateResLinkForClosure(id string) string {
	if id == "" {
		return ""
	}
	return "/resources/closures/" + id
}

func CreateResLinkForClosureDescription(id string) string {
	if id == "" {
		return ""
	}
	return "/resources/closure-descriptions/" + id
}

//Function to create resource links from the provided ID as parameter.
func CreateResLinksForNetwork(ids []string) []string {
	links := make([]string, 0)
	for i := range ids {
		link := "/resources/container-networks/" + ids[i]
		links = append(links, link)
	}
	return links
}

//Function to change specific part of the url.
func UpdateResLinksForApps(args []string) []string {
	size := len(args)
	var links = make([]string, size)
	for _, link := range args {
		newLink := strings.Replace(link, "/resources/composite-descriptions/", "/resources/composite-components/", 1)
		links = append(links, newLink)
	}
	return links
}

//Function that extract all the links which are contained as values in the given map as argument.
//Return slice of the extracted links, which will be used to make request for either some start, stop or remove command.
func GetAllLinks(m map[string][]string) []string {
	links := make([]string, 0)

	for _, val := range m {
		for _, name := range val {
			links = append(links, name)
		}
	}
	return links
}

//GetResourceID takes any document self link and returns the last part of it
//containing the ID.
func GetResourceID(s string) string {
	arr := strings.Split(s, "/")
	return arr[len(arr)-1]
}

//Same as GetResourceID but for array of self links and returns array of IDs.
func GetResourceIDs(s []string) []string {
	ids := make([]string, 0)
	for i := range s {
		idArr := strings.Split(s[i], "/")
		id := idArr[len(idArr)-1]
		ids = append(ids, id)
	}
	return ids
}

// GetIdFilterUrl returns string which is URL required to check if the initially
// provided ID for some operation is unique and try to retrieve the full ID,
// assuming the user has used short ID.
func GetIdFilterUrl(shortId string, restype ResourceType) string {
	var url string
	switch restype {
	case APPLICATION:
		shortSelfLink := CreateResLinksForApps([]string{shortId})
		url = ApplicationFilterID + createIdFilter(shortSelfLink[0])
	case CERTIFICATE:
		shortSelfLink := CreateResLinkForCerts(shortId)
		url = CertFilterID + createIdFilter(shortSelfLink)
	case CONTAINER:
		shortSelfLink := CreateResLinksForContainer([]string{shortId})
		url = ContainerFilterID + createIdFilter(shortSelfLink[0])
	case CREDENTIALS:
		shortSelfLink := CreateResLinkForCredentials(shortId)
		url = CredentialsFilterID + createIdFilter(shortSelfLink)
	case DEPLOYMENT_POLICY:
		shortSelfLink := CreateResLinkForDeploymentPolicies(shortId)
		url = DeploymentPolicyFilterID + createIdFilter(shortSelfLink)
	case HOST:
		shortSelfLink := CreateResLinksForHosts(shortId)
		url = HostFilterID + createIdFilter(shortSelfLink)
	case NETWORK:
		shortSelfLink := CreateResLinksForNetwork([]string{shortId})
		url = NetworkFilterID + createIdFilter(shortSelfLink[0])
	case PLACEMENT:
		shortSelfLink := CreateResLinksForPlacement(shortId)
		url = PlacementFilterID + createIdFilter(shortSelfLink)
	case PLACEMENT_ZONE:
		shortSelfLink := CreateResLinkForResourcePool(shortId)
		url = PlacementZoneFilterID + createIdFilter(shortSelfLink)
	case PROJECT:
		shortSelfLink := CreateResLinkForProject(shortId)
		url = ProjectFilterID + createIdFilter(shortSelfLink)
	case REGISTRY:
		shortSelfLink := CreateResLinkForRegistry(shortId)
		url = RegistryFilterID + createIdFilter(shortSelfLink)
	case REQUEST:
		shortSelfLink := CreateResLinkForRequest(shortId)
		url = RequestFilterID + createIdFilter(shortSelfLink)
	case TEMPLATE:
		shortSelfLink := CreateResLinkForTemplate(shortId)
		url = TemplateFilterID + createIdFilter(shortSelfLink)
	case ENDPOINT:
		shortSelfLink := CreateResLinkForEndpoint(shortId)
		url = EndpointFilterID + createIdFilter(shortSelfLink)
	case CLOSURE:
		shortSelfLink := CreateResLinkForClosure(shortId)
		url = ClosureFilterID + createIdFilter(shortSelfLink)
	case CLOSURE_DESCRIPTION:
		shortSelfLink := CreateResLinkForClosureDescription(shortId)
		url = ClosureDescriptionFilterID + createIdFilter(shortSelfLink)
	}
	return url
}

func GetNameFilterUrl(name string, restype ResourceType) string {
	var url string
	switch restype {
	case APPLICATION:
		url = ApplicationFilterName + createNameFilter(name)
	case CERTIFICATE:
		url = CertFilterName + createNameFilter(name)
	case CLOSURE:
		url = ClosureFilterName + createNameFilter(name)
	case CLOSURE_DESCRIPTION:
		url = ClosureDescriptionFilterName + createNameFilter(name)
	case CONTAINER:
		url = ContainerFilterName + createNameFilter(name)
	case CREDENTIALS:
		url = CredentialsFilterName + createNameFilter(name)
	case DEPLOYMENT_POLICY:
		url = DeploymentPolicyFilterName + createNameFilter(name)
	case ENDPOINT:
		url = EndpointFilterName + createNameFilter(name)
	case HOST:
		url = createNameFilterHost(name)
	case NETWORK:
		url = NetworkFilterName + createNameFilter(name)
	case PLACEMENT:
		url = PlacementFilterName + createNameFilter(name)
	case PLACEMENT_ZONE:
		url = PlacementZoneFilterName + createNameFilter(name)
	case PROJECT:
		url = ProjectFilterName + createNameFilter(name)
	case REGISTRY:
		url = RegistryFilterName + createNameFilter(name)
	case TEMPLATE:
		url = TemplateFilterName + createNameFilter(name)

	}
	return url
}

// Help function to build up the string containing the URL.
func createIdFilter(shortSelfLink string) string {
	return fmt.Sprintf("'%s*'", shortSelfLink)
}

func createNameFilter(name string) string {
	return fmt.Sprintf("'%s'", name)
}

func createNameFilterHost(name string) string {
	return fmt.Sprintf(HostFilterName, name, name, name)
}
