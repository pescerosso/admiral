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

import * as actions from 'actions/Actions';
import modal from 'core/modal';
import constants from 'core/constants';
import computeConstants from 'core/computeConstants';
import utils from 'core/utils';
import docs from 'core/docs';

var _isFirstTimeUser = true;

var silenced = false;

crossroads.addRoute('/', function() {
  if (_isFirstTimeUser) {
    hasher.setHash('home');
  } else {
    hasher.setHash('hosts');
  }
});

crossroads.addRoute('/home', function() {
 actions.AppActions.openHome();
});

//crossroads.addRoute('/closures', function() {
//  actions.AppActions.openView(constants.VIEWS.CLOSURES.name);
//  actions.ClosureActions.openClosures();
//});

//crossroads.addRoute('/home/newClosure', function() {
//  actions.AppActions.openHome();
//  actions.ClosureActions.openAddClosure();
//});

crossroads.addRoute('/closures/new', function() {
  actions.AppActions.openView(constants.VIEWS.TEMPLATES.name);
  actions.TemplateActions.openAddClosure();
});

crossroads.addRoute('/home/newHost', function() {
  actions.AppActions.openHome();
  actions.HostActions.openAddHost();
});

crossroads.addRoute('/hosts:?query:', function(query) {
  if (silenced) {
    return;
  }
  actions.AppActions.openView(constants.VIEWS.HOSTS.name);
  actions.HostActions.openHosts(query);
});

crossroads.addRoute('/hosts/new', function() {
  actions.AppActions.openView(constants.VIEWS.HOSTS.name);
  actions.HostActions.openAddHost();
});

crossroads.addRoute('/hosts/{hostId*}', function(hostId) {
  actions.AppActions.openView(constants.VIEWS.HOSTS.name);
  actions.HostActions.editHost(hostId);
});

crossroads.addRoute('/placements', function() {
  actions.AppActions.openView(constants.VIEWS.PLACEMENTS.name);
  actions.PlacementActions.openPlacements();
});

crossroads.addRoute('/applications:?query:', function(query) {
  actions.AppActions.openView(constants.VIEWS.RESOURCES.VIEWS.APPLICATIONS.name);

  query = query || {};
  query.$category = 'applications';
  actions.ContainerActions.openContainers(query, true);
});

crossroads.addRoute('/networks:?query:', function(query) {
  actions.AppActions.openView(constants.VIEWS.RESOURCES.VIEWS.NETWORKS.name);

  query = query || {};
  query.$category = 'networks';
  actions.ContainerActions.openContainers(query, true);
});

crossroads.addRoute('/closures', function() {
  actions.AppActions.openView(constants.VIEWS.RESOURCES.VIEWS.CLOSURES.name);
  actions.ContainerActions.openContainers({
    '$category': 'closures'
  }, true, true);
});

crossroads.addRoute('/closures:?query:', function(query) {
  actions.AppActions.openView(constants.VIEWS.RESOURCES.VIEWS.CLOSURES.name);

  query = query || {};
  query.$category = 'closures';
  actions.ContainerActions.openContainers(query, true, true);
});

crossroads.addRoute('/templates:?query:', function(query) {
  actions.AppActions.openView(constants.VIEWS.TEMPLATES.name);
  actions.TemplateActions.openTemplates(query, true);
});

crossroads.addRoute('/templates/image/{imageId*}/newContainer', function(imageId) {
  actions.AppActions.openView(constants.VIEWS.TEMPLATES.name);
  actions.TemplateActions.openTemplates();
  actions.TemplateActions.openContainerRequest(constants.TEMPLATES.TYPES.IMAGE, imageId);
});

crossroads.addRoute('/templates/template/{templateId*}', function(templateId) {
  actions.AppActions.openView(constants.VIEWS.TEMPLATES.name);
  actions.TemplateActions.openTemplates();
  actions.TemplateActions.openTemplateDetails(constants.TEMPLATES.TYPES.TEMPLATE, templateId);
});

crossroads.addRoute('/templates/template/{templateId*}/newContainer', function(templateId) {
  actions.AppActions.openView(constants.VIEWS.TEMPLATES.name);
  actions.TemplateActions.openTemplates();
  actions.TemplateActions.openContainerRequest(constants.TEMPLATES.TYPES.TEMPLATE, templateId);
});

crossroads.addRoute('/registries', function() {
  actions.AppActions.openView(constants.VIEWS.TEMPLATES.name);
  actions.RegistryActions.openRegistries();
});

crossroads.addRoute('/import-template', function() {
  actions.AppActions.openView(constants.VIEWS.TEMPLATES.name);
  actions.TemplateActions.openImportTemplate();
});

crossroads.addRoute('/containers:?query:', function(query) {
  let viewName = constants.VIEWS.RESOURCES.VIEWS.CONTAINERS.name;

  actions.AppActions.openView(viewName);

  query = query || {};
  query.$category = 'containers';
  actions.ContainerActions.openContainers(query, true);
});

crossroads.addRoute('/containers/new', function() {
  actions.AppActions.openView(constants.VIEWS.RESOURCES.VIEWS.CONTAINERS.name);
  actions.ContainerActions.openContainers();
  actions.ContainerActions.openCreateContainer();
});

crossroads.addRoute('/networks/new', function() {
  actions.AppActions.openView(constants.VIEWS.RESOURCES.VIEWS.NETWORKS.name);
  actions.ContainerActions.openContainers({
    '$category': 'networks'
  }, true);
  actions.ContainerActions.openCreateNetwork();
});

crossroads.addRoute('containers/composite/{compositeComponentId*}' +
                    '/cluster/{clusterId*}/containers/{childContainerId*}',
                    function(compositeComponentId, clusterId, childContainerId) {
  actions.AppActions.openView(constants.VIEWS.RESOURCES.VIEWS.APPLICATIONS.name);
  actions.ContainerActions.openContainers();
  actions.ContainerActions.openContainerDetails(childContainerId, clusterId, compositeComponentId);
});

crossroads.addRoute('containers/composite/{compositeComponentId*}/containers/{childContainerId*}',
                    function(compositeComponentId, childContainerId) {
  actions.AppActions.openView(constants.VIEWS.RESOURCES.VIEWS.APPLICATIONS.name);
  actions.ContainerActions.openContainers();
  actions.ContainerActions.openContainerDetails(childContainerId, null, compositeComponentId);
});

crossroads.addRoute('containers/composite/{compositeComponentId*}/cluster/{clusterId*}',
                    function(compositeComponentId, clusterId) {
  actions.AppActions.openView(constants.VIEWS.RESOURCES.VIEWS.APPLICATIONS.name);
  actions.ContainerActions.openContainers();
  actions.ContainerActions.openClusterDetails(clusterId, compositeComponentId);
});

crossroads.addRoute('containers/composite/{compositeComponentId*}', function(compositeComponentId) {
  actions.AppActions.openView(constants.VIEWS.RESOURCES.VIEWS.APPLICATIONS.name);
  actions.ContainerActions.openContainers();
  actions.ContainerActions.openCompositeContainerDetails(compositeComponentId);
});

crossroads.addRoute('/containers/{containerId*}', function(containerId) {
  actions.AppActions.openView(constants.VIEWS.RESOURCES.VIEWS.CONTAINERS.name);
  actions.ContainerActions.openContainers();
  actions.ContainerActions.openContainerDetails(containerId);
});

crossroads.addRoute('/closures/{closureId*}', function(closureId) {
  actions.AppActions.openView(constants.VIEWS.RESOURCES.VIEWS.CLOSURES.name);
  actions.ContainerActions.openClosureDetails(closureId);
});

crossroads.addRoute('/resource-pools', function() {
  actions.AppActions.openView(computeConstants.VIEWS.RESOURCE_POOLS.name);
});

crossroads.addRoute('/environments', function() {
  actions.AppActions.openView(computeConstants.VIEWS.ENVIRONMENTS.name);
  actions.EnvironmentsActions.openEnvironments();
});

crossroads.addRoute('/machines:?query:', function(query) {
  actions.AppActions.openView(computeConstants.VIEWS.RESOURCES.VIEWS.MACHINES.name);
  actions.MachineActions.openMachines(query, true);
});


crossroads.addRoute('/machines/{machineId*}', function() {
  // not yet supported
  // actions.AppActions.openView(computeConstants.VIEWS.RESOURCES.VIEWS.MACHINES.name);
  // actions.MachineActions.openMachines();
  // actions.MachineActions.openMachineDetails(machineId);
});

crossroads.addRoute('/compute:?query:', function(query) {
  actions.AppActions.openView(computeConstants.VIEWS.COMPUTE.name);
  actions.ComputeActions.openCompute(query, true);
});

crossroads.addRoute('/compute/{computeId*}', function(computeId) {
  actions.AppActions.openView(computeConstants.VIEWS.COMPUTE.name);
  actions.ComputeActions.editCompute(computeId);
});

// Nothing from the above is matched, redirect to main
crossroads.bypassed.add(function() {
  hasher.setHash('');
});

actions.NavigationActions.openHome.listen(function() {
  hasher.setHash('home');
});

actions.NavigationActions.openHomeAddHost.listen(function() {
  hasher.setHash('home/newHost');
});

actions.NavigationActions.openHosts.listen(function(queryOptions) {
  hasher.setHash(getHashWithQuery('hosts', queryOptions));
});

actions.NavigationActions.openHostsSilently.listen(function() {
  silenced = true;
  hasher.setHash('hosts');
  silenced = false;
});

actions.NavigationActions.openAddHost.listen(function() {
  hasher.setHash('hosts/new');
});

actions.NavigationActions.editHost.listen(function(hostId) {
  hasher.setHash('hosts/' + hostId);
});

actions.NavigationActions.openTemplates.listen(function(queryOptions) {
  hasher.setHash(getHashWithQuery('templates', queryOptions));
});

actions.NavigationActions.openRegistries.listen(function() {
  hasher.setHash('registries');
});

actions.NavigationActions.openTemplateDetails.listen(function(type, itemId) {
  if (type === constants.TEMPLATES.TYPES.TEMPLATE) {
    hasher.setHash('templates/template/' + itemId);
  } else {
    hasher.setHash('templates/image/' + itemId);
  }
});

actions.NavigationActions.openContainerRequest.listen(function(type, itemId) {
  if (type === constants.TEMPLATES.TYPES.TEMPLATE) {
    hasher.setHash('templates/template/' + itemId + '/newContainer');
  } else {
    hasher.setHash('templates/image/' + itemId + '/newContainer');
  }
});

actions.NavigationActions.openContainers.listen(function(queryOptions) {
  var category;
  if (queryOptions) {
    category = queryOptions.$category;
    queryOptions = $.extend({}, queryOptions);
    delete queryOptions.$category;
  }

  category = category || constants.CONTAINERS.SEARCH_CATEGORY.CONTAINERS;
  hasher.setHash(getHashWithQuery(category, queryOptions));
});

actions.NavigationActions.openNetworks.listen(function(queryOptions) {
  var category;
  if (queryOptions) {
    category = queryOptions.$category;
    queryOptions = $.extend({}, queryOptions);
    delete queryOptions.$category;
  }

  category = category || constants.CONTAINERS.SEARCH_CATEGORY.NETWORKS;
  hasher.setHash(getHashWithQuery(category, queryOptions));
});

actions.NavigationActions.openContainerDetails.listen(function(containerId, clusterId,
                                                                compositeComponentId) {
  if (clusterId && compositeComponentId) {
    hasher.setHash('containers/composite/' + compositeComponentId + '/cluster/' + clusterId +
                  '/containers/' + containerId);
  } else if (clusterId) {
    hasher.setHash('containers/cluster/' + clusterId + '/containers/' + containerId);
  } else if (compositeComponentId) {
    hasher.setHash('containers/composite/' + compositeComponentId + '/containers/' + containerId);
  } else {
    hasher.setHash('containers/' + containerId);
  }
});

actions.NavigationActions.openClosureDetails.listen(function(closureId) {
  hasher.setHash('closures/' + closureId);
});

actions.NavigationActions.openClusterDetails.listen(function(clusterId, compositeComponentId) {
  if (compositeComponentId) {
    hasher.setHash('containers/composite/' + compositeComponentId + '/cluster/' + clusterId);
  } else {
    hasher.setHash('containers/cluster/' + clusterId);
  }
});

actions.NavigationActions.openCompositeContainerDetails.listen(function(compositeComponentId) {
  hasher.setHash('containers/composite/' + compositeComponentId);
});

actions.NavigationActions.showContainersPerPlacement.listen(function(placementId) {
  let queryOptions = {
    'placement': placementId
  };

  hasher.setHash(getHashWithQuery('containers', queryOptions));
});

actions.NavigationActions.openPlacements.listen(function() {
  hasher.setHash('placements');
});

actions.NavigationActions.openEnvironments.listen(function() {
  hasher.setHash('environments');
});

actions.NavigationActions.openMachines.listen(function(queryOptions) {
  hasher.setHash(getHashWithQuery('machines', queryOptions));
});

actions.NavigationActions.openCompute.listen(function(queryOptions) {
  hasher.setHash(getHashWithQuery('compute', queryOptions));
});

actions.NavigationActions.editCompute.listen(function(hostId) {
  hasher.setHash('compute/' + hostId);
});

actions.NavigationActions.openMachineDetails.listen(function() {
  // not yet supported
  // hasher.setHash('machines/' + machineId);
});

actions.NavigationActions.openHomeAddClosure.listen(function() {
  hasher.setHash('home/newClosure');
});

actions.NavigationActions.openClosuresSilently.listen(function() {
  hasher.changed.active = false;
  hasher.setHash('closures');
  hasher.changed.active = true;
});

actions.NavigationActions.openClosures.listen(function() {
 hasher.setHash('closures');
});

actions.NavigationActions.openAddClosure.listen(function() {
  hasher.setHash('closures/new');
});

function parseHash(newHash) {
  // In case of any opened modals, through interaction with browser, we should close in any case
  modal.hide();
  crossroads.parse(newHash);

  if (newHash) {
    docs.update('/' + newHash);
  } else {
    docs.update('/');
  }
}

function getHashWithQuery(hash, queryOptions) {
  var queryString;
  if (queryOptions) {
    queryString = utils.paramsToURI(queryOptions);
  }

  if (queryString) {
    return hash + '?' + queryString;
  } else {
    return hash;
  }
}

var routes = {
  initialize: function(isFirstTimeUser) {
    _isFirstTimeUser = isFirstTimeUser;
    hasher.stop();
    hasher.initialized.add(parseHash); // Parse initial hash
    hasher.changed.add(parseHash); // Parse hash changes
    hasher.init(); // Start listening for history change
  },

  getHash: function() {
    return hasher.getHash();
  },

  getContainersHash: function(queryOptions) {
    return getHashWithQuery('containers', queryOptions);
  }
};

export default routes;