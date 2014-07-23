/*
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
Copyright (c) 2014 Mozilla Corporation

Contributors:
Jeff Bryner jbryner@mozilla.com
Anthony Verez averez@mozilla.com
 */

if (Meteor.isClient) {

    //elastic search cluster template functions
    //return es health items
    Template.mozdefhealth.esclusterhealthitems = function () {
        return healthescluster.find();
    };

    Template.mozdefhealth.frontendhealthitems = function () {
        return healthfrontend.find();
    };

    Template.mozdefhealth.esnodeshealthitems = function () {
        return healthesnodes.find();
    };

    Template.mozdefhealth.eshotthreadshealthitems = function () {
        return healtheshotthreads.find();
    };

    Template.mozdefhealth.helpers({
      lastupdate: function() {
        var obj = healthfrontend.findOne();
        if (obj) {
          return obj.utctimestamp;
        }
        else {
          return null;
        }
      }
    });

 
   Template.mozdefhealth.rendered = function () {
        var ringChartEPS   = dc.pieChart("#ringChart-EPS");
        var totalEPS   = dc.numberDisplay("#total-EPS");
        var ringChartLoadAverage = dc.pieChart("#ringChart-LoadAverage");
        
        refreshChartData=function(){
            var frontEndData=healthfrontend.find({}).fetch();
            var ndx = crossfilter(frontEndData);

            if ( frontEndData.length === 0 && ndx.size()>0){
                console.log('clearing ndx/dc.js');
                dc.filterAll();
                ndx.remove();
                dc.redrawAll();
            } else {
                ndx = crossfilter(frontEndData);
            }            
            if ( ndx.size() >0){ 
                var hostDim  = ndx.dimension(function(d) {return d.hostname;});
                var hostEPS = hostDim.group().reduceSum(function(d) {return d.details.total_deliver_eps.toFixed(2);});
                var hostLoadAverage = hostDim.group().reduceSum(function(d) {return d.details.loadaverage[0];});
                var epsTotal = ndx.groupAll().reduceSum(function(d) {return d.details.total_deliver_eps;});
                
                totalEPS
                    .valueAccessor(function(d){return d;})
                    .group(epsTotal);
                
                ringChartEPS
                    .width(150).height(150)
                    .dimension(hostDim)
                    .group(hostEPS)
                    .label(function(d) {return d.value; })
                    .innerRadius(30)
                    .filter = function() {};
        
                ringChartLoadAverage
                    .width(150).height(150)
                    .dimension(hostDim)
                    .group(hostLoadAverage)
                    .label(function(d) {return d.value; })
                    .innerRadius(30)
                    .filter = function() {};
        
                dc.renderAll();
            }
        }

        Deps.autorun(function() {
            Meteor.subscribe("healthfrontend",onReady=function(){
                Deps.nonreactive(refreshChartData);
            });
            Meteor.subscribe("healthescluster");
            Meteor.subscribe("healthesnodes");
            Meteor.subscribe("healtheshotthreads");
            

        }); //end deps.autorun
     };
}