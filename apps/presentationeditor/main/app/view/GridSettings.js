/*
 *
 * (c) Copyright Ascensio System SIA 2010-2022
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-12 Ernesta Birznieka-Upisha
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
*/
/**
 *  GridSettings.js
 *
 *  Created by Julia Radzhabova on 09/30/22
 *  Copyright (c) 2022 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'common/main/lib/component/Window',
    'common/main/lib/component/MetricSpinner',
    'common/main/lib/component/ComboBox'
], function () { 'use strict';

    PE.Views.GridSettings = Common.UI.Window.extend(_.extend({
        options: {
            width: 214,
            header: true,
            style: 'min-width: 315px;',
            cls: 'modal-dlg',
            id: 'window-grid-settings',
            buttons: ['ok', 'cancel']
        },

        initialize : function(options) {
            _.extend(this.options, {
                title: this.textTitle
            }, options || {});

            this.template = [
                '<div class="box" style="height: 55px;">',
                    '<div class="input-row">',
                        '<label class="text">' + this.textSpacing + '</label>',
                    '</div>',
                    '<div id="grid-spacing-combo" class="input-group-nr" style="display: inline-block;width:86px;"></div>',
                    '<div id="grid-spacing-spin" style="display: inline-block;margin-left: 10px;"></div>',
                '</div>',
                '<div class="separator horizontal"></div>'
            ].join('');

            this.options.tpl = _.template(this.template)(this.options);

            Common.UI.Window.prototype.initialize.call(this, this.options);
        },

        render: function() {
            Common.UI.Window.prototype.render.call(this);

            var $window = this.getChild();
            this.arrSpacing = (Common.Utils.Metric.getCurrentMetric() === Common.Utils.Metric.c_MetricUnits.inch) ? [
                { displayValue: '1/24 \"', value: 0, spacing: 0.04 },
                { displayValue: '1/16 \"', value: 1, spacing:  0.06 },
                { displayValue: '1/12 \"', value: 2, spacing:  0.08 },
                { displayValue: '1/10 \"', value: 3, spacing:  0.1 },
                { displayValue: '1/8 \"', value: 4, spacing:  0.13 },
                { displayValue: '1/6 \"', value: 5, spacing:  0.17 },
                { displayValue: '1/5 \"', value: 6, spacing:  0.2 },
                { displayValue: '1/4 \"', value: 7, spacing:  0.25 },
                { displayValue: '1/3 \"', value: 8, spacing:  0.33 },
                { displayValue: '1/2 \"', value: 9, spacing:  0.5 },
                { displayValue: '1 \"', value: 10, spacing:  1 },
                { displayValue: '2 \"', value: 11, spacing:  2 },
                { displayValue: this.textCustom, value: -1 }
            ] : [
                { displayValue: '1/8 ' + this.textCm, value: 0, spacing: 0.13 },
                { displayValue: '1/6 ' + this.textCm, value: 1, spacing: 0.17 },
                { displayValue: '1/5 ' + this.textCm, value: 2, spacing: 0.2 },
                { displayValue: '1/4 ' + this.textCm, value: 3, spacing: 0.25 },
                { displayValue: '1/3 ' + this.textCm, value: 4, spacing: 0.33 },
                { displayValue: '1/2 ' + this.textCm, value: 5, spacing: 0.5 },
                { displayValue: '1 ' + this.textCm, value: 6, spacing: 1 },
                { displayValue: '2 ' + this.textCm, value: 7, spacing: 2 },
                { displayValue: '3 ' + this.textCm, value: 8, spacing: 3 },
                { displayValue: '4 ' + this.textCm, value: 9, spacing: 4 },
                { displayValue: '5 ' + this.textCm, value: 10, spacing: 5 },
                { displayValue: this.textCustom, value: -1 }
            ];
            this.cmbGridSpacing = new Common.UI.ComboBox({
                el: $window.find('#grid-spacing-combo'),
                cls: 'input-group-nr',
                style: 'width: 100%;',
                menuStyle: 'min-width: 86px;max-height: 185px;',
                editable: false,
                takeFocusOnClose: true,
                data: this.arrSpacing
            });
            this.cmbGridSpacing.on('selected', _.bind(function(combo, record) {
                if (record.value<0) {
                } else {
                    this.spnSpacing.setValue(record.spacing, true);
                }
            }, this));

            this.spnSpacing = new Common.UI.MetricSpinner({
                el: $window.find('#grid-spacing-spin'),
                step: .01,
                width: 86,
                defaultUnit : Common.Utils.Metric.getCurrentMetric() === Common.Utils.Metric.c_MetricUnits.inch ? "\"": "cm",
                value: Common.Utils.Metric.getCurrentMetric() === Common.Utils.Metric.c_MetricUnits.inch ? "1 \"" : '1 cm',
                maxValue: Common.Utils.Metric.getCurrentMetric() === Common.Utils.Metric.c_MetricUnits.inch ? 2 : 5.08,
                minValue: Common.Utils.Metric.getCurrentMetric() === Common.Utils.Metric.c_MetricUnits.inch ? 0.04 : 0.1
            });
            this.spnSpacing.on('change', _.bind(function(field, newValue, oldValue, eOpts){
                var value = this.spnSpacing.getNumberValue(),
                    idx = -1;
                for (var i=0; i<this.arrSpacing.length; i++) {
                    var item = this.arrSpacing[i];
                    if (item.spacing<1 && Math.abs(item.spacing - value)<0.005 || item.spacing>=1 && Math.abs(item.spacing - value)<0.001) {
                        idx = i;
                        break;
                    }
                }
                this.cmbGridSpacing.setValue(idx);
            }, this));

            $window.find('.dlg-btn').on('click', _.bind(this.onBtnClick, this));
        },

        getFocusedComponents: function() {
            return [ this.cmbGridSpacing, this.spnSpacing ];
        },

        getDefaultFocusableComponent: function () {
            return this.cmbGridSpacing;
        },

        _handleInput: function(state) {
            if (this.options.handler) {
                this.options.handler.call(this, this, state);
            }

            this.close();
        },

        onBtnClick: function(event) {
            this._handleInput(event.currentTarget.attributes['result'].value);
        },

        onPrimary: function() {
            this._handleInput('ok');
            return false;
        },

        setSettings: function (value) {
            value = Common.Utils.Metric.fnRecalcFromMM(value/36000,
            Common.Utils.Metric.getCurrentMetric() === Common.Utils.Metric.c_MetricUnits.inch ? Common.Utils.Metric.c_MetricUnits.inch : Common.Utils.Metric.c_MetricUnits.cm);
            var idx = -1;
            for (var i=0; i<this.arrSpacing.length; i++) {
                var item = this.arrSpacing[i];
                if (item.spacing<1 && Math.abs(item.spacing - value)<0.005 || item.spacing>=1 && Math.abs(item.spacing - value)<0.001)
                    idx = i;
            }
            this.cmbGridSpacing.setValue(idx, -1);
            this.spnSpacing.setValue(value, true);
        },

        getSettings: function() {
            return this.spnSpacing.getNumberValue();
        },

        textTitle: 'Grid Settings',
        textSpacing: 'Spacing',
        textCm: 'cm',
        textCustom: 'Custom'
    }, PE.Views.GridSettings || {}))
});