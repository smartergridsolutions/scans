var async = require('async');

var helpers = require('../../../helpers/oracle');

module.exports = {
    title: 'Open SQLServer',
    category: 'Virtual Cloud Network',
    description: 'Determine if TCP port 1433 or UDP port 1434 for SQL Server is open to the public',
    more_info: 'While some ports such as HTTP and HTTPS are required to be open to the public to function properly, more sensitive services such as SQL server should be restricted to known IP addresses.',
    recommended_action: 'Restrict TCP port 1433 and UDP port 1434 to known IP addresses',
    link: 'https://docs.cloud.oracle.com/iaas/Content/Network/Concepts/securitylists.htm',
    apis: ['vcn:list', 'vcn:get', 'publicIp:list', 'securityList:list'],

    run: function(cache, settings, callback) {
        var results = [];
        var source = {};
        var regions = helpers.regions(settings.govcloud);

        async.each(regions.vcn, function(region, rcb){
            var vcn = helpers.addSource(cache, source,
                ['vcn', 'list', region]);

            if (!vcn) return rcb();

            if (vcn.err) {
                helpers.addResult(results, 3,
                    vcn.err.code + ": " + helpers.addError(vcn), region);
                return rcb();
            }

            var ports = {
                'tcp': [1433],
                'udp': [1434]
            };

            var service = 'SQL Server';

            var getSecurityLists = helpers.addSource(cache, source,
                ['securityList', 'list', region]);

            if (!getSecurityLists) return rcb();

            if (getSecurityLists.err && getSecurityLists.err.length>0)  {
                helpers.addResult(results, 3,
                    'Unable to query for security lists: ' + helpers.addError(getSecurityLists), region);
                return rcb();
            }

            if (!getSecurityLists.data || !getSecurityLists.data.length>0) {
                helpers.addResult(results, 0, 'No security lists present', region);
                return rcb();
            }

            helpers.findOpenPorts(getSecurityLists.data, ports, service, region, results);

            rcb();
        }, function(){
            // Global checking goes here
            callback(null, results, source);
        });
    }
};