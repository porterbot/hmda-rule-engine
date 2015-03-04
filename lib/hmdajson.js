'use strict';

var chomp = require('line-chomper').chomp;
var specValidator = require('./filespecvalidator');
var TYPES = require('./filerecordtypes');

var _JSONOBJ = {};

var _addTransmittalSheet = function(record) {
    _JSONOBJ.hmdaFile.transmittalSheet = record;
};

var _addLoanApplicationRegister = function(record) {
    _JSONOBJ.hmdaFile.loanApplicationRegisters.push(record);
};


var typeFunctions = {};
typeFunctions[TYPES[0]] = _addTransmittalSheet;
typeFunctions[TYPES[1]] = _addLoanApplicationRegister;

var checkParams = function(file_stream, file_spec) {
    var error = null;
    if (! file_stream) {
        return 'Missing file to process';
    }
    if (! file_spec) {
        return 'Missing file specification';
    }
    error = specValidator.validate(file_spec);
    return error;
};

var HMDAJson = function() {
    var processor = {};
    function LAR() {
        this.recordID = "";
        this.respondentID = "";
        this.agencyCode = "";
        this.loanNumber = "";
        this.applicationReceivedDate = "";
        this.loanType = "";
        this.propertyType = "";
        this.loanPurpose = "";
        this.ownerOccupancy = "";
        this.loanAmount = "";
        this.preapprovals = "";
        this.actionTaken = "";
        this.actionDate = "";
        this.metroArea = "";
        this.fipsState = "";
        this.fipsCounty = "";
        this.censusTract = "";
        this.applicantEthnicity = "";
        this.coapplicantEthnicity = "";
        this.applicantRace1 = "";
        this.applicantRace2 = "";
        this.applicantRace3 = "";
        this.applicantRace4 = "";
        this.applicantRace5 = "";
        this.coapplicantRace1 = "";
        this.coapplicantRace2 = "";
        this.coapplicantRace3 = "";
        this.coapplicantRace4 = "";
        this.coapplicantRace5 = "";
        this.applicantSex = "";
        this.coapplicantSex = "";
        this.applicantIncome = "";
        this.purchaserType = "";
        this.denialReason1 = "";
        this.denialReason2 = "";
        this.denialReason3 = "";
        this.rateSpread = "";
        this.hoepaStatus = "";
        this.lienStatus = "";
        this.filler = "";
    }

    processor.resetJsonOb = function() {
        _JSONOBJ = {
            hmdaFile: {
                transmittalSheet: {},
                loanApplicationRegisters: []
            }
        };
    };

    processor.addToJsonOb = function(type, record) {
        var func = typeFunctions[type];
        if (func) {
            func(record);
        }
    };

    processor.getJsonObject = function() {
        return _JSONOBJ;
    };

    processor.parseLine = function(type, line_spec, line) {
        var result = {};
        result.record = {};
        if (type=='loanApplicationRegister') {
             result.record = new LAR();
        }
        for(var field in line_spec) {
            if (line_spec.hasOwnProperty(field) && line.length >= line_spec[field].end) {
                var value = line.slice(line_spec[field].start-1, line_spec[field].end);
                if (line_spec[field].dataType === 'N' && !Number(value) && Number(value) !== 0) {
                    result.error = '\'' + field + '\' must be a number';
                    break;
                }
                result.record[field] = value.trim();
            } else {
                result.error = 'Line is not long enough to contain \'' + field + '\'';
                break;
            }
        }
        return result;
    };

    processor.process = function(file_stream, file_spec, next) {
        var error = checkParams(file_stream, file_spec);
        if (error) {
            return next(error, null);
        }
        processor.resetJsonOb();
        chomp(file_stream, {trim: false}, function(err, lines) {
            for (var lineIdx=0; lineIdx < lines.length; lineIdx++) {
                var type = TYPES[lineIdx] ? TYPES[lineIdx] : TYPES[1];
                var line_spec = file_spec[type];
                var result = processor.parseLine(type,line_spec, lines[lineIdx]);
                if (result.error) {
                    error = 'Error parsing ' + type + ' at line: ' + (lineIdx+1) + ' - ' + result.error;
                    return next(error, null);
                }
                result.record.lineNumber = (lineIdx + 1).toString();
                processor.addToJsonOb(type, result.record);
            }
            return next(error, processor.getJsonObject());
        });
    };

    return processor;
};

module.exports = new HMDAJson();
