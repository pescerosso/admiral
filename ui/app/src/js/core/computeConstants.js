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

var computeConstants = Immutable({
  LOADING: {},
  CONTEXT_PANEL: {
    PLACEMENT_ZONES: 'placementZones',
    CREDENTIALS: 'credentials',
    CERTIFICATES: 'certificates',
    REQUESTS: 'requests',
    EVENTLOGS: 'eventlogs'
  },
  VIEWS: {
    HOME: {name: 'home'},
    PROFILES: {
      name: 'profiles'
    },
    ENDPOINTS: {
      name: 'endpoints'
    },
    PLACEMENTS: {
      name: 'placements'
    },
    COMPUTE: {
      name: 'compute'
    },
    RESOURCES: {
      name: 'resources',
      VIEWS: {
        MACHINES: {
          name: 'machines',
          route: 'machines',
          default: true
        },
        NETWORKS: {
          name: 'networks',
          route: 'networks'
        }
      }
    }
  }
});

export default computeConstants;
