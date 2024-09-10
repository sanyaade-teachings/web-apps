/*
 * (c) Copyright Ascensio System SIA 2010-2024
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
 * You can contact Ascensio System SIA at 20A-6 Ernesta Birznieka-Upish
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
 *  SignatureSettings.js
 *
 *  Created on 5/24/17
 *
 */

define([
    'text!presentationeditor/main/app/template/SignatureSettings.template',
    'jquery',
    'underscore',
    'backbone',
    'common/main/lib/component/Button'
], function (menuTemplate, $, _, Backbone) {
    'use strict';

    PE.Views.SignatureSettings = Backbone.View.extend(_.extend({
        el: '#id-signature-settings',

        // Compile our stats template
        template: _.template(menuTemplate),

        // Delegated events for creating new items, and clearing completed ones.
        events: {
        },

        options: {
            alias: 'SignatureSettings'
        },

        initialize: function () {
            this._state = {
                DisabledEditing: false,
                ready: false,
                hasValid: false,
                hasInvalid: false,
                tip: undefined
            };
            this._locked = false;

            this.render();
        },

        render: function () {
            this.$el.html(this.template({
                scope: this
            }));

            var protection = PE.getController('Common.Controllers.Protection').getView();
            this.btnAddInvisibleSign = protection.getButton('signature');
            this.btnAddInvisibleSign.render(this.$el.find('#signature-invisible-sign'));

            this.viewValidList = new Common.UI.DataView({
                el: $('#signature-valid-sign'),
                enableKeyEvents: false,
                itemTemplate: _.template([
                    '<div id="<%= id %>" class="signature-item">',
                        '<div class="caret img-commonctrl img-colored <% if (name == "" || date == "") { %>' + 'nomargin' + '<% } %>"></div>',
                        '<div class="name"><%= Common.Utils.String.htmlEncode(name) %></div>',
                        '<div class="date"><%= Common.Utils.String.htmlEncode(date) %></div>',
                    '</div>'
                ].join(''))
            });

            this.viewInvalidList = new Common.UI.DataView({
                el: $('#signature-invalid-sign'),
                enableKeyEvents: false,
                itemTemplate: _.template([
                    '<div id="<%= id %>" class="signature-item">',
                        '<div class="caret img-commonctrl <% if (name == "" || date == "") { %>' + 'nomargin' + '<% } %>"></div>',
                        '<div class="name"><%= Common.Utils.String.htmlEncode(name) %></div>',
                        '<div class="date"><%= Common.Utils.String.htmlEncode(date) %></div>',
                    '</div>'
                ].join(''))
            });

            this.viewValidList.on('item:click', _.bind(this.onSelectSignature, this));
            this.viewInvalidList.on('item:click', _.bind(this.onSelectSignature, this));
            this.viewValidList.on('item:contextmenu', _.bind(this.onItemContextMenu, this));
            this.viewInvalidList.on('item:contextmenu', _.bind(this.onItemContextMenu, this));

            this.signatureMenu = new Common.UI.Menu({
                menuAlign   : 'tr-br',
                items: [
                    { caption: this.strDetails,value: 1 },
                    { caption: this.strDelete, value: 3 }
                ]
            });
            this.signatureMenu.on('item:click', _.bind(this.onMenuSignatureClick, this));
        },

        setApi: function(api) {
            this.api = api;
            if (this.api) {
                this.api.asc_registerCallback('asc_onUpdateSignatures',    _.bind(this.onApiUpdateSignatures, this));
            }
            Common.NotificationCenter.on('document:ready', _.bind(this.onDocumentReady, this));
            return this;
        },

        ChangeSettings: function(props) {
            if (!this._state.hasValid && !this._state.hasInvalid)
                this.updateSignatures(this.api.asc_getSignatures());
        },

        setLocked: function (locked) {
            this._locked = locked;
        },

        setMode: function(mode) {
            this.mode = mode;
        },

        onApiUpdateSignatures: function(valid){
            if (!this._state.ready) return;

            this.updateSignatures(valid);
            this.showSignatureTooltip(this._state.hasValid, this._state.hasInvalid);
        },

        updateSignatures: function(valid){
            var me = this,
                validSignatures = [],
                invalidSignatures = [];

            _.each(valid, function(item, index){
                var item_date = item.asc_getDate();
                var sign = {name: item.asc_getSigner1(), certificateId: item.asc_getId(), guid: item.asc_getGuid(), date: (!_.isEmpty(item_date)) ? new Date(item_date).toLocaleString() : '', invisible: !item.asc_getVisible()};
                (item.asc_getValid()==0) ? validSignatures.push(sign) : invalidSignatures.push(sign);
            });

            // validSignatures = [{name: 'Hammish Mitchell', guid: '123', date: '18/05/2017', invisible: true}, {name: 'Someone Somewhere', guid: '345', date: '18/05/2017'}];
            // invalidSignatures = [{name: 'Mary White', guid: '111', date: '18/05/2017'}, {name: 'John Black', guid: '456', date: '18/05/2017'}];

            me._state.hasValid = validSignatures.length>0;
            me._state.hasInvalid = invalidSignatures.length>0;

            this.viewValidList.store.reset(validSignatures);
            this.viewInvalidList.store.reset(invalidSignatures);

            this.$el.find('.valid').toggleClass('hidden', !me._state.hasValid);
            this.$el.find('.invalid').toggleClass('hidden', !me._state.hasInvalid);

            me.disableEditing(me._state.hasValid || me._state.hasInvalid);
        },

        onItemContextMenu: function(picker, item, record, e){
            var menu = this.signatureMenu;
            if (menu.isVisible()) {
                menu.hide();
            }

            var offsetParent = $(this.el).offset(),
                showPoint = [e.clientX*Common.Utils.zoom() - offsetParent.left + 5, e.clientY*Common.Utils.zoom() - offsetParent.top + 5];

            this.showSignatureMenu(record, showPoint);

            menu.menuAlign = Common.UI.isRTL() ? 'tr-br' : 'tl-bl';
            menu.menuAlignEl = null;
            menu.setOffset(15, 5);
            menu.show();
            _.delay(function() {
                menu.cmpEl.focus();
            }, 10);
        },

        onSelectSignature: function(picker, item, record, e){
            if (!record) return;

            var btn = $(e.target);
            if (btn && btn.hasClass('caret')) {
                var menu = this.signatureMenu;
                if (menu.isVisible()) {
                    menu.hide();
                    return;
                }

                var currentTarget = $(e.currentTarget),
                    offset = currentTarget.offset(),
                    offsetParent = $(this.el).offset(),
                    showPoint = [offset.left - offsetParent.left + currentTarget.width(), offset.top - offsetParent.top + currentTarget.height()/2];

                this.showSignatureMenu(record, showPoint);

                menu.menuAlign = Common.UI.isRTL() ? 'tl-bl' : 'tr-br';
                menu.menuAlignEl = currentTarget;
                menu.setOffset(-20, -currentTarget.height()/2 + 3);
                menu.show();
                _.delay(function() {
                    menu.cmpEl.focus();
                }, 10);
                e.stopPropagation();
                e.preventDefault();
            }
        },

        showSignatureMenu: function(record, showPoint) {
            this.api.asc_gotoSignature(record.get('guid'));
            
            var menu = this.signatureMenu,
                parent = $(this.el),
                menuContainer = parent.find('#menu-signature-container');
            if (!menu.rendered) {
                if (menuContainer.length < 1) {
                    menuContainer = $('<div id="menu-signature-container" style="position: absolute; z-index: 10000;"><div class="dropdown-toggle" data-toggle="dropdown"></div></div>', menu.id);
                    parent.append(menuContainer);
                }
                menu.render(menuContainer);
                menu.cmpEl.attr({tabindex: "-1"});

                menu.on({
                    'show:after': function(cmp) {
                        if (cmp && cmp.menuAlignEl)
                            cmp.menuAlignEl.toggleClass('over', true);
                    },
                    'hide:after': function(cmp) {
                        if (cmp && cmp.menuAlignEl)
                            cmp.menuAlignEl.toggleClass('over', false);
                    }
                });
            }
            menu.items[1].setDisabled(this._locked);
            menu.items[0].cmpEl.attr('data-value', record.get('certificateId')); // view certificate
            menu.cmpEl.attr('data-value', record.get('guid'));

            menuContainer.css({left: showPoint[0], top: showPoint[1]});
        },

        onMenuSignatureClick:  function(menu, item) {
            var guid = menu.cmpEl.attr('data-value');
            switch (item.value) {
                case 1:
                    this.api.asc_ViewCertificate(item.cmpEl.attr('data-value'));
                    break;
                case 3:
                    var me = this;
                    Common.UI.warning({
                        title: this.notcriticalErrorTitle,
                        msg: this.txtRemoveWarning,
                        buttons: ['ok', 'cancel'],
                        primary: 'ok',
                        callback: function(btn) {
                            if (btn == 'ok') {
                                me.api.asc_RemoveSignature(guid);
                            }
                        }
                    });
                    break;
            }
        },

        onDocumentReady: function() {
            this._state.ready = true;

            this.updateSignatures(this.api.asc_getSignatures(), this.api.asc_getRequestSignatures());
            this.showSignatureTooltip(this._state.hasValid, this._state.hasInvalid);
        },

        showSignatureTooltip: function(hasValid, hasInvalid) {
            var me = this,
                tip = me._state.tip;

            if (!hasValid && !hasInvalid) {
                if (tip && tip.isVisible()) {
                    tip.close();
                    me._state.tip = undefined;
                }
                return;
            }

            var showLink = hasValid || hasInvalid,
                tipText = (hasInvalid) ? me.txtSignedInvalid : (hasValid ? me.txtSigned : "");

            if (tip && tip.isVisible() && (tipText !== tip.text || showLink !== tip.showLink)) {
                tip.close();
                me._state.tip = undefined;
            }

            if (!me._state.tip) {
                tip = new Common.UI.SynchronizeTip({
                    target  : PE.getController('RightMenu').getView('RightMenu').btnSignature.btnEl,
                    text    : tipText,
                    showLink: showLink,
                    textLink: this.txtContinueEditing,
                    placement: Common.UI.isRTL() ? 'right-bottom' : 'left-bottom'
                });
                tip.on({
                    'dontshowclick': function() {
                        Common.UI.warning({
                            title: me.notcriticalErrorTitle,
                            msg: me.txtEditWarning,
                            buttons: ['ok', 'cancel'],
                            primary: 'ok',
                            callback: function(btn) {
                                if (btn == 'ok') {
                                    tip.close();
                                    me._state.tip = undefined;
                                    me.api.asc_RemoveAllSignatures();
                                }
                            }
                        });
                    },
                    'closeclick': function() {
                        tip.close();
                        me._state.tip = undefined;
                    }
                });
                me._state.tip = tip;
                tip.show();
            }
        },

        hideSignatureTooltip: function() {
            var tip = this._state.tip;
            if (tip && tip.isVisible()) {
                tip.close();
                this._state.tip = undefined;
            }
        },

        disableEditing: function(disable) {
            if (this._state.DisabledEditing != disable) {
                this._state.DisabledEditing = disable;

                Common.NotificationCenter.trigger('editing:disable', disable, {
                    viewMode: disable,
                    allowSignature: true,
                    rightMenu: {clear: false, disable: true},
                    statusBar: true,
                    leftMenu: {disable: false, previewMode: true},
                    fileMenu: false,
                    comments: {disable: false, previewMode: true},
                    chat: false,
                    review: true,
                    viewport: false,
                    documentHolder: {clear: true, disable: true},
                    toolbar: true
                }, 'signature');
            }
        },

        strSignature: 'Signature',
        strValid: 'Valid signatures',
        strInvalid: 'Invalid signatures',
        strDetails: 'Signature Details',
        txtSigned: 'Valid signatures has been added to the presentation. The presentation is protected from editing.',
        txtSignedInvalid: 'Some of the digital signatures in presentation are invalid or could not be verified. The presentation is protected from editing.',
        txtContinueEditing: 'Edit anyway',
        notcriticalErrorTitle: 'Warning',
        txtEditWarning: 'Editing will remove the signatures from the presentation.<br>Are you sure you want to continue?',
        strDelete: 'Remove Signature',
        txtRemoveWarning: 'Are you sure you want to remove this signature?<br>This action cannot be undone.'

    }, PE.Views.SignatureSettings || {}));
});