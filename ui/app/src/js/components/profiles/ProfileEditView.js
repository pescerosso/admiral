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

import AwsComputeProfileEditor from 'components/profiles/aws/ComputeProfileEditor'; //eslint-disable-line
import AwsNetworkProfileEditor from 'components/profiles/aws/NetworkProfileEditor'; //eslint-disable-line
import AwsStorageProfileEditor from 'components/profiles/aws/StorageProfileEditor'; //eslint-disable-line
import AzureComputeProfileEditor from 'components/profiles/azure/ComputeProfileEditor'; //eslint-disable-line
import AzureNetworkProfileEditor from 'components/profiles/azure/NetworkProfileEditor'; //eslint-disable-line
import AzureStorageProfileEditor from 'components/profiles/azure/StorageProfileEditor'; //eslint-disable-line
import vSphereComputeProfileEditor from 'components/profiles/vsphere/ComputeProfileEditor'; //eslint-disable-line
import vSphereNetworkProfileEditor from 'components/profiles/vsphere/NetworkProfileEditor'; //eslint-disable-line
import vSphereStorageProfileEditor from 'components/profiles/vsphere/StorageProfileEditor'; //eslint-disable-line

import { ProfileActions, NavigationActions } from 'actions/Actions';
import EndpointsList from 'components/endpoints/EndpointsList'; //eslint-disable-line
import SubnetworkSearch from 'components/subnetworks/SubnetworkSearch'; //eslint-disable-line
import SubnetworksList from 'components/subnetworks/SubnetworksList'; //eslint-disable-line
import ProfileEditViewVue from 'components/profiles/ProfileEditViewVue.html';
import utils from 'core/utils';

export default Vue.component('profile-edit-view', {
  template: ProfileEditViewVue,
  props: {
    model: {
      default: () => ({
        contextView: {}
      }),
      required: true,
      type: Object
    }
  },
  data() {
    let endpointType = this.model.item.endpoint &&
        this.model.item.endpoint.endpointType || this.model.item.endpointType;
    let tags = this.model.item.tags || [];
    return {
      adapters: utils.getAdapters(),
      computeProfileEditor: {
        properties: this.model.item.computeProfile || {},
        valid: false
      },
      networkProfileEditor: {
        properties: this.model.item.networkProfile || {},
        valid: false
      },
      storageProfileEditor: {
        properties: this.model.item.storageProfile || {},
        valid: false
      },
      currentView: 'basic',
      editorErrors: null,
      endpoint: this.model.item.endpoint,
      endpointType,
      name: this.model.item.name,
      tags: tags.map(({key, value}) => ({
        key,
        value
      }))
    };
  },
  computed: {
    saveDisabled() {
      return !this.name || !this.endpointType;
    },
    validationErrors() {
      return this.model.validationErrors || this.editorErrors || {};
    },
    activeContextItem() {
      return this.model.contextView && this.model.contextView.activeItem &&
        this.model.contextView.activeItem.name;
    },
    contextExpanded() {
      return this.model.contextView && this.model.contextView.expanded;
    }
  },
  attached() {
    $(this.$el).find('.nav a[data-toggle=pill]').on('click', (e) => {
      if ($(e.target).parent().hasClass('disabled')) {
        e.preventDefault();
        return false;
      }
      this.currentView = $(e.target).attr('href').substring(1);
      ProfileActions.selectView(this.currentView,
          this.endpoint && this.endpoint.documentSelfLink);
    });

    $(this.$el).find('.nav-item a[href="#' + this.currentView + '"]').tab('show');
    ProfileActions.selectView(this.currentView,
        this.endpoint && this.endpoint.documentSelfLink);

    this.unwatchEndpoint = this.$watch('model.item.endpoint', (endpoint) => {
      this.endpoint = endpoint;
    });
  },
  detached() {
    this.unwatchEndpoint();
  },
  methods: {
    goBack() {
      NavigationActions.openProfiles();
    },
    save($event) {
      $event.stopImmediatePropagation();
      $event.preventDefault();

      let model = this.getModel();
      var tagRequest = utils.createTagAssignmentRequest(model.documentSelfLink,
          this.model.item.tags || [], this.tags);
      if (model.documentSelfLink) {
        ProfileActions.updateProfile(model, tagRequest);
      } else {
        ProfileActions.createProfile(model, tagRequest);
      }
    },
    onNameChange(value) {
      this.name = value;
    },
    onEndpointChange(endpoint) {
      this.endpoint = endpoint;
      this.endpointType = endpoint && endpoint.endpointType;
    },
    onTagsChange(tags) {
      this.tags = tags;
    },
    onComputeProfileEditorChange(value) {
      this.editorErrors = null;
      this.computeProfileEditor = value;
    },
    onNetworkProfileEditorChange(value) {
      this.editorErrors = null;
      this.networkProfileEditor = value;
    },
    onNetworkCreateSubnetwork() {
      ProfileActions.createSubnetwork();
    },
    onNetworkManageSubnetworks() {
      ProfileActions.manageSubnetworks();
    },
    onStorageProfileEditorChange(value) {
      this.editorErrors = null;
      this.storageProfileEditor = value;
    },
    onEditorError(errors) {
      this.editorErrors = errors;
    },
    createEndpoint() {
      ProfileActions.createEndpoint();
    },
    manageEndpoints() {
      ProfileActions.manageEndpoints();
    },
    manageSubnetworks() {
      ProfileActions.manageSubnetworks();
    },
    closeToolbar() {
      ProfileActions.closeToolbar();
    },
    getModel() {
      // TODO: prepare a PATCH body instead of full-blown document
      var toSave = $.extend({ properties: {} }, this.model.item.asMutable({deep: true}));
      toSave.name = this.name;
      toSave.endpointLink = this.endpoint && this.endpoint.documentSelfLink;
      toSave.computeProfile = $.extend(toSave.computeProfile || {},
          this.computeProfileEditor.properties);
      toSave.networkProfile = $.extend(toSave.networkProfile || {},
          this.networkProfileEditor.properties);
      toSave.storageProfile = $.extend(toSave.storageProfile || {},
          this.storageProfileEditor.properties);
      toSave.tagLinks = undefined;
      return toSave;
    }
  }
});
