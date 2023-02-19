/*
 *
 * (c) Copyright Ascensio System SIA 2010-2019
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
 *  ListView.js
 *
 *  Created by Julia Radzhabova on 2/27/14
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

if (Common === undefined)
    var Common = {};

define([
    'common/main/lib/component/DataView'
], function () {
    'use strict';

    Common.UI.ListView = Common.UI.DataView.extend((function() {
        return {
            options: {
                handleSelect: true,
                enableKeyEvents: true,
                showLast: true,
                simpleAddMode: false,
                headers: [],
                initSort: null,         //{type: 'string', direction: -1 or 1}
                keyMoveDirection: 'vertical',
                itemTemplate: _.template('<div id="<%= id %>" class="list-item" style=""><%= value %></div>'),
                cls: ''
            },

            template: _.template([
                '<div class="listview inner <%= cls %>" <% if (options.dataHint) { %> data-hint="<%= options.dataHint %>" <% } if (options.dataHintDirection) { %> data-hint-direction="<%= options.dataHintDirection %>" <% } if (options.dataHintOffset) { %> data-hint-offset="<%= options.dataHintOffset %>" <% } %>>',
                '</div>'
            ].join('')),

            initialize : function(options) {
                Common.UI.DataView.prototype.initialize.call(this, options);

                if(this.options.initSort != null) {
                    this.activeSortType = this.options.initSort.type;
                    this.sortDirection = this.options.initSort.direction;
                }
            }, 

            insertHeaders: function() {
                if(this.options.headers.length == 0) return;

                var template = _.template([
                    '<div class="table-header">',
                        '<% _.each(headers, function(header){ %>',
                            '<%if (header.sortType) { %>',
                                '<div class="table-header-item" style="width: <%=header.width%>px;" sort-type="<%=header.sortType%>">',
                                    '<span class="header-sorted">',
                                        '<label><%= header.name %></label>',
                                        '<div style="width: 6px;height: 6px;"></div>',
                                        '<span class="sort-direction caret <%if (sortDirection == -1) { %>sort-desc <% } if (activeSortType != header.sortType) { %>hidden<%}%>"></span>',
                                    '</span>',
                                '</div>',
                            '<%} else { %>',
                                '<label class="table-header-item" style="width: <%=header.width%>px;"><%= header.name %></label>',
                            '<%}%>',
                        '<% }); %>',
                    '</div>'
                ].join(''))({headers: this.options.headers, activeSortType: this.activeSortType, sortDirection: this.sortDirection});
                this.$el.find('.listview').prepend(template);

                var me = this;
                this.$el.find('.table-header-item .header-sorted').on('click', function(e) {
                    var selectedSortType = $(e.currentTarget).parent().attr('sort-type');

                    if(me.activeSortType === selectedSortType){
                        me.sortDirection = -me.sortDirection
                    }
                    else {
                        me.activeSortType = selectedSortType;
                        me.sortDirection = 1;
                    }

                    me.trigger('header:click', me.activeSortType, me.sortDirection);
                    me.focus();
                });
            },

            setHeaderName: function(index, name) {
                if(index < 0 || index > this.options.headers.length - 1) return;

                var labelEl = $(this.$el.find('.table-header-item')[index]);
                if(labelEl.attr('sort-type')) {
                    labelEl = labelEl.find('label')[0];
                }

                this.options.headers[index].name = name;
                labelEl.text(name);
            },

            setHeaderWidth: function(index, width) {
                if(index < 0 || index > this.options.headers.length - 1) return;

                var labelEl = $(this.$el.find('.table-header-item')[index]);
                if(labelEl.attr('sort-type')) {
                    labelEl = labelEl.find('label')[0];
                }

                this.options.headers[index].width = width;
                $(labelEl).width(width);
            },

            onResetItems : function() {
                this.innerEl = null;
                Common.UI.DataView.prototype.onResetItems.call(this);
                this.trigger('items:reset', this);
                this.insertHeaders();
            },

            createNewItem: function(record) {
                return new Common.UI.DataViewItem({
                    template: this.itemTemplate,
                    model: record
                });
            },

            onAddItem: function(record, store, opts) {
                var view = this.createNewItem(record);

                if (!this.innerEl)
                    this.innerEl = $(this.el).find('.inner');

                if (view && this.innerEl) {
                    (this.dataViewItems.length<1) && this.innerEl.find('.empty-text').remove();
                    if (this.options.simpleAddMode) {
                        this.innerEl.append(view.render().el);
                        this.dataViewItems.push(view);
                    } else {
                        var idx = _.indexOf(this.store.models, record);
                        var innerDivs = this.innerEl.find('> .item');

                        if (idx > 0)
                            $(innerDivs.get(idx - 1)).after(view.render().el);
                        else {
                            (innerDivs.length > 0) ? $(innerDivs[idx]).before(view.render().el) : this.innerEl.append(view.render().el);
                        }
                        this.dataViewItems = this.dataViewItems.slice(0, idx).concat(view).concat(this.dataViewItems.slice(idx));
                    }
                    this.listenTo(view, 'change',  this.onChangeItem);
                    this.listenTo(view, 'remove',  this.onRemoveItem);
                    this.listenTo(view, 'click',   this.onClickItem);
                    this.listenTo(view, 'dblclick',this.onDblClickItem);
                    this.listenTo(view, 'select',  this.onSelectItem);

                    if (record.get('tip')) {
                        var view_el = $(view.el);
                        view_el.attr('data-toggle', 'tooltip');
                        view_el.tooltip({
                            title       : record.get('tip'),
                            placement   : 'cursor',
                            zIndex : this.tipZIndex
                        });
                    }

                    if (!this.isSuspendEvents)
                        this.trigger('item:add', this, view, record);
                }
            },

            focus: function() {
                this.cmpEl && this.cmpEl.find('.listview').focus();
            },

            scrollToRecord: function (record, force) {
                if (!this._fromKeyDown) {
                    Common.UI.DataView.prototype.scrollToRecord.call(this, record, force);
                    return;
                }

                if (!record) return;
                var innerEl = $(this.el).find('.inner'),
                    innerHeight = innerEl.innerHeight(),
                    idx = _.indexOf(this.store.models, record),
                    div = (idx>=0 && this.dataViewItems.length>idx) ? $(this.dataViewItems[idx].el) : innerEl.find('#' + record.get('id'));
                if (div.length<=0) return;

                var div_top = div.position().top,
                    div_height = div.outerHeight(),
                    newpos;

                if (force || div_top<0)
                    newpos = innerEl.scrollTop() + div_top;
                else if (div_top+div_height>innerHeight)
                    newpos = innerEl.scrollTop() + div_top + div_height - innerHeight;

                if (newpos!==undefined) {
                    if (this.scroller && this.allowScrollbar) {
                        this.scroller.scrollTop(newpos, 0);
                    } else {
                        innerEl.scrollTop(newpos);
                    }
                }
            }
        }
    })());
});