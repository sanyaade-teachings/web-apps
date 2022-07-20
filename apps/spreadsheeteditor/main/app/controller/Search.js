/*
 *
 * (c) Copyright Ascensio System SIA 2010-2020
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
 *  ViewTab.js
 *
 *  Created by Julia Svinareva on 22.02.2022
 *  Copyright (c) 2022 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'core',
    'common/main/lib/view/SearchPanel'
], function () {
    'use strict';

    SSE.Controllers.Search = Backbone.Controller.extend(_.extend({
        sdkViewName : '#id_main',

        views: [
            'Common.Views.SearchPanel'
        ],

        initialize: function () {
            this.addListeners({
                'SearchBar': {
                    'search:back': _.bind(this.onSearchNext, this, 'back'),
                    'search:next': _.bind(this.onSearchNext, this, 'next'),
                    'search:input': _.bind(this.onInputSearchChange, this),
                    'search:keydown': _.bind(this.onSearchNext, this, 'keydown'),
                    'show': _.bind(this.onSelectSearchingResults, this, true),
                    'hide': _.bind(this.onSelectSearchingResults, this, false)
                },
                'Common.Views.SearchPanel': {
                    'search:back': _.bind(this.onSearchNext, this, 'back'),
                    'search:next': _.bind(this.onSearchNext, this, 'next'),
                    'search:replace': _.bind(this.onQueryReplace, this),
                    'search:replaceall': _.bind(this.onQueryReplaceAll, this),
                    'search:input': _.bind(this.onInputSearchChange, this),
                    'search:options': _.bind(this.onChangeSearchOption, this),
                    'search:keydown': _.bind(this.onSearchNext, this, 'keydown'),
                    'show': _.bind(this.onShowPanel, this),
                    'hide': _.bind(this.onHidePanel, this)
                },
                'LeftMenu': { // TO DO
                    'search:aftershow': _.bind(this.onShowAfterSearch, this)
                }
            });
        },
        onLaunch: function () {
            this._state = {
                searchText: undefined,
                matchCase: false,
                matchWord: false,
                useRegExp: false,
                withinSheet: Asc.c_oAscSearchBy.Sheet,
                searchByRows: true,
                lookInFormulas: true,
                isValidSelectedRange: true
            };
        },

        setMode: function (mode) {
            this.view = this.createView('Common.Views.SearchPanel', { mode: mode });
            this.view.on('render:after', _.bind(this.onAfterRender, this));
        },

        setApi: function (api) {
            if (api) {
                this.api = api;
                this.api.asc_registerCallback('asc_onRenameCellTextEnd', _.bind(this.onRenameText, this));
                this.api.asc_registerCallback('asc_onSetSearchCurrent', _.bind(this.onUpdateSearchCurrent, this));
                this.api.asc_registerCallback('asc_onStartTextAroundSearch', _.bind(this.onStartTextAroundSearch, this));
                this.api.asc_registerCallback('asc_onEndTextAroundSearch', _.bind(this.onEndTextAroundSearch, this));
                this.api.asc_registerCallback('asc_onGetTextAroundSearchPack', _.bind(this.onApiGetTextAroundSearch, this));
                this.api.asc_registerCallback('asc_onRemoveTextAroundSearch', _.bind(this.onApiRemoveTextAroundSearch, this));
                this.api.asc_registerCallback('asc_onSearchEnd', _.bind(this.onApiSearchEnd, this));
                this.api.asc_registerCallback('asc_onActiveSheetChanged', _.bind(this.onActiveSheetChanged, this));
            }
            return this;
        },

        getView: function(name) {
            return !name && this.view ?
                this.view : Backbone.Controller.prototype.getView.call(this, name);
        },

        onAfterRender: function () {
            var me = this;
            this.view.inputSelectRange.validation = function(value) {
                if (_.isEmpty(value)) {
                    return true;
                }
                var isvalid = me.api.asc_checkDataRange(undefined, value);
                me._state.isValidSelectedRange = isvalid !== Asc.c_oAscError.ID.DataRangeError;
                return (isvalid === Asc.c_oAscError.ID.DataRangeError) ? me.textInvalidRange : true;
            };
            this.view.inputSelectRange.on('button:click', _.bind(this.onRangeSelect, this));
        },

        onChangeSearchOption: function (option, value, noSearch) {
            var runSearch = true;
            switch (option) {
                case 'case-sensitive':
                    this._state.matchCase = value;
                    break;
                case 'match-word':
                    this._state.matchWord = value;
                    break;
                case 'regexp':
                    this._state.useRegExp = value;
                    break;
                case 'within':
                    this._state.withinSheet = value === 0 ? Asc.c_oAscSearchBy.Sheet : (value === 1 ? Asc.c_oAscSearchBy.Workbook : Asc.c_oAscSearchBy.Range);
                    this.view.inputSelectRange.setDisabled(value !== Asc.c_oAscSearchBy.Range);
                    if (value === Asc.c_oAscSearchBy.Range) {
                        runSearch = false;
                    }
                    break;
                case 'range':
                    this._state.selectedRange = value;
                    runSearch = !noSearch;
                    break;
                case 'search':
                    this._state.searchByRows = value;
                    break;
                case 'lookIn':
                    this._state.lookInFormulas = value;
                    break;
            }
            if (runSearch) {
                this.hideResults();
                if (this.onQuerySearch()) {
                    this.searchTimer && clearInterval(this.searchTimer);
                    this.searchTimer = undefined;
                    this.api.asc_StartTextAroundSearch();
                }
            }
        },

        onRangeSelect: function () {
            var me = this;
            var handlerDlg = function(dlg, result) {
                if (result == 'ok') {
                    var valid = dlg.getSettings();
                    me.view.inputSelectRange.setValue(valid);
                    me.view.inputSelectRange.checkValidate();
                    me.onChangeSearchOption('range', valid);
                }
            };

            var win = new SSE.Views.CellRangeDialog({
                handler: handlerDlg
            }).on('close', function() {
                _.delay(function(){
                    me.view.inputSelectRange.focus();
                },1);
            });
            win.show();
            win.setSettings({
                api: me.api,
                range: (!_.isEmpty(me.view.inputSelectRange.getValue()) && (me.view.inputSelectRange.checkValidate()==true)) ? me.view.inputSelectRange.getValue() : me._state.selectedRange,
                type: Asc.c_oAscSelectionDialogType.PrintTitles
            });
        },

        onSearchNext: function (type, text, e) {
            var isReturnKey = type === 'keydown' && e.keyCode === Common.UI.Keys.RETURN;
            if (isReturnKey || type !== 'keydown') {
                this._state.searchText = text;
                if (this.onQuerySearch(type) && (this.searchTimer || isReturnKey)) {
                    this.hideResults();
                    if (this.searchTimer) {
                        clearInterval(this.searchTimer);
                        this.searchTimer = undefined;
                    }
                    if (this.view.$el.is(':visible')) {
                        this.api.asc_StartTextAroundSearch();
                    }
                }
            }
        },

        onInputSearchChange: function (text) {
            var me = this;
            if (this._state.searchText !== text) {
                this._state.newSearchText = text;
                this._lastInputChange = (new Date());
                if (this.searchTimer === undefined) {
                    this.searchTimer = setInterval(function(){
                        if ((new Date()) - me._lastInputChange < 400) return;

                        me.hideResults();
                        me._state.searchText = me._state.newSearchText;
                        if (me.onQuerySearch()) {
                            if (me.view.$el.is(':visible')) {
                                me.api.asc_StartTextAroundSearch();
                            }
                        } else if (me._state.newSearchText === '') {
                            me.view.updateResultsNumber('no-results');
                            me.view.disableNavButtons();
                            Common.NotificationCenter.trigger('search:updateresults', undefined, 0);
                        }
                        clearInterval(me.searchTimer);
                        me.searchTimer = undefined;
                    }, 10);
                }
            }
        },

        onQuerySearch: function (d, isNeedRecalc) {
            var me = this;
            if (this._state.withinSheet === Asc.c_oAscSearchBy.Range && !this._state.isValidSelectedRange) {
                Common.UI.warning({
                    title: this.notcriticalErrorTitle,
                    msg: this.textInvalidRange,
                    buttons: ['ok'],
                    callback: function () {
                        me.view.focus('range');
                    }
                });
                return;
            }

            var options = new Asc.asc_CFindOptions();
            options.asc_setFindWhat(this._state.searchText);
            options.asc_setScanForward(d != 'back');
            options.asc_setIsMatchCase(this._state.matchCase);
            options.asc_setIsWholeCell(this._state.matchWord);
            options.asc_setScanOnOnlySheet(this._state.withinSheet);
            if (this._state.withinSheet === Asc.c_oAscSearchBy.Range) {
                options.asc_setSpecificRange(this._state.selectedRange);
            }
            options.asc_setScanByRows(this._state.searchByRows);
            options.asc_setLookIn(this._state.lookInFormulas ? Asc.c_oAscFindLookIn.Formulas : Asc.c_oAscFindLookIn.Value);
            options.asc_setNeedRecalc(isNeedRecalc);
            if (!this.api.asc_findText(options)) {
                this.resultItems = [];
                this.view.updateResultsNumber(undefined, 0);
                this._state.currentResult = 0;
                this._state.resultsNumber = 0;
                this.view.disableNavButtons();
                Common.NotificationCenter.trigger('search:updateresults', undefined, 0);
                return false;
            }
            return true;
        },

        onQueryReplace: function(textSearch, textReplace) {
            this.api.isReplaceAll = false;
            var options = new Asc.asc_CFindOptions();
            options.asc_setFindWhat(textSearch);
            options.asc_setReplaceWith(textReplace);
            options.asc_setIsMatchCase(this._state.matchCase);
            options.asc_setIsWholeCell(this._state.matchWord);
            options.asc_setScanOnOnlySheet(this._state.withinSheet);
            if (this._state.withinSheet === Asc.c_oAscSearchBy.Range) {
                options.asc_setSpecificRange(this._state.selectedRange);
            }
            options.asc_setScanByRows(this._state.searchByRows);
            options.asc_setLookIn(this._state.lookIn ? Asc.c_oAscFindLookIn.Formulas : Asc.c_oAscFindLookIn.Value);
            options.asc_setIsReplaceAll(false);

            this.api.asc_replaceText(options);
        },

        onQueryReplaceAll: function(textSearch, textReplace) {
            this.api.isReplaceAll = true;
            var options = new Asc.asc_CFindOptions();
            options.asc_setFindWhat(textSearch);
            options.asc_setReplaceWith(textReplace);
            options.asc_setIsMatchCase(this._state.matchCase);
            options.asc_setIsWholeCell(this._state.matchWord);
            options.asc_setScanOnOnlySheet(this._state.withinSheet);
            if (this._state.withinSheet === Asc.c_oAscSearchBy.Range) {
                options.asc_setSpecificRange(this._state.selectedRange);
            }
            options.asc_setScanByRows(this._state.searchByRows);
            options.asc_setLookIn(this._state.lookIn ? Asc.c_oAscFindLookIn.Formulas : Asc.c_oAscFindLookIn.Value);
            options.asc_setIsReplaceAll(true);

            this.api.asc_replaceText(options);
        },

        onRenameText: function (found, replaced) {
            var me = this;
            if (this.api.isReplaceAll) {
                if (!found) {
                    this.removeResultItems();
                } else {
                    !(found-replaced) && this.removeResultItems();
                    Common.UI.info({
                        msg: (!(found-replaced) || replaced > found) ? Common.Utils.String.format(this.textReplaceSuccess,replaced) : Common.Utils.String.format(this.textReplaceSkipped,found-replaced),
                        callback: function() {
                            me.view.focus();
                        }
                    });
                }
            } else {
                var options = new Asc.asc_CFindOptions();
                options.asc_setFindWhat(this._state.searchText);
                options.asc_setScanForward(true);
                options.asc_setIsMatchCase(this._state.matchCase);
                options.asc_setIsWholeCell(this._state.matchWord);
                options.asc_setScanOnOnlySheet(this._state.withinSheet);
                if (this._state.withinSheet === Asc.c_oAscSearchBy.Range) {
                    options.asc_setSpecificRange(this._state.selectedRange);
                }
                options.asc_setScanByRows(this._state.searchByRows);
                options.asc_setLookIn(this._state.lookInFormulas ? Asc.c_oAscFindLookIn.Formulas : Asc.c_oAscFindLookIn.Value);
                if (!this.api.asc_findText(options)) {
                    this.removeResultItems();
                }
            }
        },

        removeResultItems: function (type) {
            this.resultItems = [];
            this.hideResults();
            this.view.updateResultsNumber(type, 0); // type === undefined, count === 0 -> no matches
            this._state.currentResult = 0;
            this._state.resultsNumber = 0;
            this.view.disableNavButtons();
            Common.NotificationCenter.trigger('search:updateresults', undefined, 0);
        },

        onApiRemoveTextAroundSearch: function (arr) {
            var me = this;
            arr.forEach(function (id) {
                var ind = _.findIndex(me.resultItems, {id: id});
                if (ind !== -1) {
                    me.resultItems[ind].$el.remove();
                    me.resultItems.splice(ind, 1);
                }
            });
        },

        onUpdateSearchCurrent: function (current, all) {
            if (current === -1) return;
            this._state.currentResult = current;
            this._state.resultsNumber = all;
            if (this.view) {
                this.view.updateResultsNumber(current, all);
                this.view.disableNavButtons(current, all);
                if (this.resultItems && this.resultItems.length > 0) {
                    this.resultItems.forEach(function (item) {
                        item.selected = false;
                    });
                    if (this.resultItems[current]) {
                        this.resultItems[current].selected = true;
                        $('#search-results').find('.item').removeClass('selected');
                        this.resultItems[current].$el.addClass('selected');
                        this.scrollToSelectedResult(current);
                    }
                }
            }
            Common.NotificationCenter.trigger('search:updateresults', current, all);
        },

        scrollToSelectedResult: function (ind) {
            var index = ind !== undefined ? ind : _.findIndex(this.resultItems, {selected: true});
            if (index !== -1) {
                var item = this.resultItems[index].$el,
                    itemHeight = item.outerHeight(),
                    itemTop = item.position().top,
                    container = this.view.$resultsContainer.find('.search-items'),
                    containerHeight = container.outerHeight(),
                    containerTop = container.scrollTop();
                if (itemTop < 0 || (containerTop === 0 && itemTop > containerHeight)) {
                    this.view.$resultsContainer.scroller.scrollTop(containerTop + itemTop - 12);
                } else if (itemTop + itemHeight > containerHeight) {
                    this.view.$resultsContainer.scroller.scrollTop(containerTop + itemHeight);
                }
            }
        },

        onStartTextAroundSearch: function () {
            if (this.view) {
                this._state.isStartedAddingResults = true;
            }
        },

        onEndTextAroundSearch: function () {
            if (this.view) {
                this._state.isStartedAddingResults = false;
                this.view.$resultsContainer.scroller.update({alwaysVisibleY: true});
            }
        },

        onApiGetTextAroundSearch: function (data) { // [id, sheet, name, cell, value, formula]
            if (this.view && this._state.isStartedAddingResults) {
                if (data.length > 300 || !data.length) return;
                var me = this,
                    $innerResults = me.view.$resultsContainer.find('.search-items');
                me.resultItems = [];
                data.forEach(function (item, ind) {
                    var isSelected = ind === me._state.currentResult;
                    var tr = '<div class="item" style="width: 100%;">' +
                        '<div class="sheet">' + (item[1] ? item[1] : '') + '</div>' +
                        '<div class="name">' + (item[2] ? item[2] : '') + '</div>' +
                        '<div class="cell">' + (item[3] ? item[3] : '') + '</div>' +
                        '<div class="value">' + (item[4] ? item[4] : '') + '</div>' +
                        '<div class="formula">' + (item[5] ? item[5] : '') + '</div>' +
                        '</div>';
                    var $item = $(tr).appendTo($innerResults);
                    if (isSelected) {
                        $item.addClass('selected');
                    }
                    var resultItem = {id: item[0], $el: $item, el: tr, selected: isSelected, data: data};
                    me.resultItems.push(resultItem);
                    $item.on('click', _.bind(function (el) {
                        var id = item[0];
                        me.api.asc_SelectSearchElement(id);
                    }, me));
                    me.addTooltips($item, item);
                });
                this.view.$resultsContainer.show();
            }
        },

        addTooltips: function (item, data) {
            var cells = [item.find('.sheet'), item.find('.name'), item.find('.cell'), item.find('.value'), item.find('.formula')],
                tips = [data[1], data[2], data[3], data[4], data[5]];
            cells.forEach(function (el, ind) {
                var tip = tips[ind];
                if (tip) {
                    el.one('mouseenter', function () {
                        el.attr('data-toggle', 'tooltip');
                        el.tooltip({
                            title: tip,
                            placement: 'cursor',
                            zIndex: 1000
                        });
                        el.mouseenter();
                    });
                }
            });
        },

        hideResults: function () {
            if (this.view) {
                this.view.$resultsContainer.hide();
                this.view.$resultsContainer.find('.search-items').empty();
            }
        },

        onShowAfterSearch: function (findText) {
            var viewport = this.getApplication().getController('Viewport');
            if (viewport.isSearchBarVisible()) {
                viewport.searchBar.hide();
            }

            var selectedText = this.api.asc_GetSelectedText(),
                text = typeof findText === 'string' ? findText : (selectedText && selectedText.trim() || this._state.searchText);
            if (this.resultItems && this.resultItems.length > 0 &&
                    (!text && !this.view.inputText.getValue() ||
                    !this._state.matchCase && text && text.toLowerCase() === this.view.inputText.getValue().toLowerCase() ||
                    this._state.matchCase && text === this.view.inputText.getValue())) { // show old results
                return;
            }
            if (text) {
                this.view.setFindText(text);
            } else if (text !== undefined) { // panel was opened from empty searchbar, clear to start new search
                this.view.setFindText('');
                this._state.searchText = undefined;
            }

            this.hideResults();
            if (this._state.searchText !== undefined && text === this._state.searchText) { // search was made
                this.api.asc_StartTextAroundSearch();
            } else if (this._state.searchText !== undefined) { // search wasn't made
                this.onInputSearchChange(text);
            } else {
                this.resultItems = [];
                this.view.clearResultsNumber();
            }
            this.view.disableNavButtons(this._state.currentResult, this._state.resultsNumber);
        },

        onShowPanel: function () {
            this.onSelectSearchingResults(true);
            if (this.resultItems && this.resultItems.length > 0 && !this._state.isStartedAddingResults) {
                var me = this,
                    $tableBody = this.view.$resultsContainer.find('.search-items');
                this.view.$resultsContainer.show();
                this.resultItems.forEach(function (item) {
                    var $item = $(item.el).appendTo($tableBody);
                    if (item.selected) {
                        $item.addClass('selected');
                    }
                    $item.on('click', function (el) {
                        me.api.asc_SelectSearchElement(item.id);
                        $('#search-results').find('.item').removeClass('selected');
                        $(el.currentTarget).addClass('selected');
                    });
                    me.addTooltips($item, item.data);
                });
                this.scrollToSelectedResult();
            }
        },

        onHidePanel: function () {
            this.hideResults();
            this.onSelectSearchingResults(false);
        },

        onSelectSearchingResults: function (val) {
            if (!val && this.getApplication().getController('LeftMenu').isSearchPanelVisible()) return;

            if (this._state.isHighlightedResults !== val) {
                this.api.asc_selectSearchingResults(val);
                this._state.isHighlightedResults = val;
            }
        },

        onApiSearchEnd: function () {
            this.removeResultItems('stop');
        },

        onActiveSheetChanged: function (index) {
            if (this._state.isHighlightedResults && this._state.withinSheet === Asc.c_oAscSearchBy.Sheet) {
                this.hideResults();
                if (this.onQuerySearch(undefined, true)) {
                    this.searchTimer && clearInterval(this.searchTimer);
                    this.searchTimer = undefined;
                    this.api.asc_StartTextAroundSearch();
                }
            }
        },

        textNoTextFound: 'The data you have been searching for could not be found. Please adjust your search options.',
        textReplaceSuccess: 'Search has been done. {0} occurrences have been replaced',
        textReplaceSkipped: 'The replacement has been made. {0} occurrences were skipped.',
        textInvalidRange: 'ERROR! Invalid cells range'

    }, SSE.Controllers.Search || {}));
});