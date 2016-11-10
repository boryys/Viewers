import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';

const getLocation = collection => {
    for (let i = 0; i < collection.length; i++) {
        if (collection[i].location) {
            return collection[i].location;
        }
    }
};

Template.measurementTableView.helpers({
    getNewMeasurementType(tool) {
        // TODO: Check Conformance criteria here.
        // RECIST should be targets, irRC should be nonTargets
        return {
            id: tool.id,
            name: tool.name,
            cornerstoneToolType: 'bidirectional',
            measurementTypeId: 'targets'
        };
    },

    groupByMeasurementNumber(measurementTypeId) {
        const instance = Template.instance();
        const measurementApi = instance.data.measurementApi;
        const timepointApi = instance.data.timepointApi;

        // Retrieve all the data for this Measurement type (e.g. 'targets')
        // which was recorded at baseline.
        const baseline = timepointApi.baseline();
        const atBaseline = measurementApi.fetch(measurementTypeId, {
            timepointId: baseline.timepointId
        });

        // Obtain a list of the Measurement Numbers from the
        // measurements which have baseline data
        const numbers = atBaseline.map(m => m.measurementNumber);

        // Retrieve all the data for this Measurement type which
        // match the Measurement Numbers obtained above
        const data = measurementApi.fetch(measurementTypeId, {
            measurementNumber: {
                $in: numbers
            }
        });

        // Group the Measurements by Measurement Number
        const groupObject = _.groupBy(data, entry => entry.measurementNumber);

        // Reformat the data for display in the table
        return Object.keys(groupObject).map(key => ({
            measurementTypeId: measurementTypeId,
            measurementNumber: key,
            location: getLocation(groupObject[key]),
            responseStatus: false, // TODO: Get the latest timepoint and determine the response status
            entries: groupObject[key]
        }));
    },

    newMeasurements(measurementType) {
        const instance = Template.instance();
        const measurementApi = instance.data.measurementApi;
        const timepointApi = instance.data.timepointApi;
        const measurementTypeId = measurementType.measurementTypeId;

        if (!timepointApi) {
            return;
        }

        // If this is a baseline, stop here since there are no new measurements to display
        const current = instance.data.timepointApi.current();
        if (!current || current.timepointType === 'baseline') {
            console.log('Skipping New Measurements section');
            return;
        }

        // Retrieve all the data for this Measurement type (e.g. 'targets')
        // which was recorded at baseline.
        const baseline = timepointApi.baseline();
        const atBaseline = measurementApi.fetch(measurementTypeId, {
            timepointId: baseline.timepointId
        });

        // Obtain a list of the Measurement Numbers from the
        // measurements which have baseline data
        const numbers = atBaseline.map(m => m.measurementNumber);

        // Retrieve all the data for this Measurement type which
        // do NOT match the Measurement Numbers obtained above
        const data = measurementApi.fetch(measurementTypeId, {
            measurementNumber: {
                $nin: numbers
            }
        });

        // Group the Measurements by Measurement Number
        const groupObject = _.groupBy(data, entry => entry.measurementNumber);

        // Reformat the data for display in the table
        return Object.keys(groupObject).map(key => {
            return {
                measurementTypeId: measurementTypeId,
                measurementNumber: key,
                location: getLocation(groupObject[key]),
                responseStatus: false, // TODO: Get the latest timepoint and determine the response status
                entries: groupObject[key]
            };
        });
    }
});