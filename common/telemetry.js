"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const axios_1 = require("axios");
exports.aiHandle = undefined;
const apiKey = utils_1.getInput('metricsWriteAPIKey');
if (apiKey) {
    exports.aiHandle = {
        trackException: (arg) => {
            console.log('trackException', arg);
        },
        trackMetric: (metric) => {
            var _a;
            console.log(`trackMetric ${metric.name} ${metric.value}`);
            axios_1.default({
                url: 'https://graphite-us-central1.grafana.net/metrics',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                auth: {
                    username: '6371',
                    password: apiKey,
                },
                data: JSON.stringify([
                    {
                        name: `gh_action.${metric.name}`,
                        value: metric.value,
                        interval: 60,
                        mtype: (_a = metric.type) !== null && _a !== void 0 ? _a : 'count',
                        time: Math.floor(new Date().valueOf() / 1000),
                    },
                ]),
            }).catch(e => {
                console.log(e);
            });
        },
    };
    console.log('apiKey', exports.aiHandle);
}
exports.trackEvent = async (issue, event, props) => {
    console.log('tracking event', event, props);
};
//# sourceMappingURL=telemetry.js.map