/**
 * @author William Emfinger  https://github.com/finger563
 */

define(['js/util',
        'bower/mustache.js/mustache.min',
        'text!./Dialog.html',
        'text!./Type.html',
        'css!./Dialog.css'],
       function(Util,
                mustache,
                DialogTemplate,
                TypeTemplate){
           'use strict';
           
           var Dialog;

           var ignoreTypes = ['Documentation']

           const typeMap = {
               'boolean': 'checkbox',
               'float': 'number'
           };
           const valueMap = {
               'checkbox': function(el) { return el[0].checked; }
           };
           var attrToID = function(attr) {
               return attr.replace(/ /gm, '_');
           };

           var attrForm = ['<div class="form-group" id="p{{id}}">',
                           '<label class="col-sm-4 control-label">{{attr}}</label>',
                           '<div class="col-sm-8 controls">' ,
                           '<input type="{{type}}" id="{{id}}" placeholder="">',
                           '</div>',
                           '</div>'].join('\n');

           /**
            * Dialog Constructor
            * Insert dialog modal into body and initialize editor with
            * customized options
            */
           Dialog = function () {
               // Get Modal Template node for Editor Dialog and append it to body
               this._dialog = $(DialogTemplate);
               this._dialog.appendTo($(document.body))

               // Get element nodes
               this._el = this._dialog.find('.modal-body').first();

               // forms
               this._attrForm = this._dialog.find('#attrForm').first();
               this._childSelector = this._dialog.find('#childTypeSelector').first();

               // buttons
               this._btnSave = this._dialog.find('.btn-save').first();
               this._btnClose = this._dialog.find('.close').first();
               this._btnCancel = this._dialog.find('.btn-cancel').first();
           };

           /**
            * Initialize Dialog
            * @param  {Object}     nodeDesc       Descriptor for the node that will be the parent
            * @param  {Object}     client         Client object for creating nodes and setting attributes
            * @return {void}
            */
           Dialog.prototype.initialize = function ( desc, client, position) {
               var self = this;
               self.client = client;

               // Initialize Modal and append it to main DOM
               this._dialog.modal({ show: false});

               // add children types to selector
               this._childSelector.on('change', this.selectChild.bind(this));
               this._childTypes = {};
               this._childTypes = self.getValidChildrenTypes( desc, client );
               var typeNames = Object.keys(this._childTypes).sort().reverse();
               typeNames.map(function(t) {
                   $(self._childSelector).append(new Option(t, t));
               });
               $(this._childSelector).val( typeNames[0] );
               this.renderChildForm();

               // Event listener on click for SAVE button
               this._btnSave.on('click', function (event) {
                   // Invoke callback to deal with modified text, like save it in client.
                   var attr = self.getAttributesFromForm();

                   client.startTransaction();
                   var type = self.getSelectedChildType();
                   var childCreationParams = {
                       parentId: desc.id,
                       baseId:   self.getSelectedChildMetaId(),
                       position: position,
                   };
                   var msg = 'Creating new child of type ' + type + ' with parent ' + desc.id;
                   var newChildPath = client.createChild( childCreationParams, msg );
                   // save node data here dependent on the type of node
                   Object.keys(attr).map(function( attrName ) {
                       var attrVal = attr[attrName];
                       var currentAttr = client.getNode(newChildPath).getAttribute(attrName);
                       if (attrVal != currentAttr) {
                           msg = 'Setting "'+attrName+'" to "'+attrVal+'"';
                           client.setAttribute( newChildPath, attrName, attrVal, msg );
                       }
                   });
                   client.completeTransaction('', function(err, result) {
                       if (err) {
                       } else {
                           WebGMEGlobal.State.registerActiveSelection([newChildPath], {invoker: this});
                       }
                   });

                   // Close dialog
                   self._dialog.modal({ show: false});
                   self._dialog.modal('hide');
                   event.stopPropagation();
                   event.preventDefault();
               });

               // Event listener on click for CLOSE button
               this._btnClose.on('click', function (event) {
                   // Close dialog
                   self._dialog.modal({ show: false});
                   self._dialog.modal('hide');
                   event.stopPropagation();
                   event.preventDefault();
               });

               // Event listener on click for CANCEL button
               this._btnCancel.on('click', function (event) {
                   // Close dialog
                   self._dialog.modal({ show: false});
                   self._dialog.modal('hide');
                   event.stopPropagation();
                   event.preventDefault();
               });

               // Listener on event when dialog is shown
               // Use callback to show editor after Modal window is shown.
               this._dialog.on('shown.bs.modal', function () {
                   // Render text from params into Editor and store it in local storage
               });

               // Listener on event when dialog is hidden
               this._dialog.on('hidden.bs.modal', function () {
                   self._dialog.empty();
                   self._dialog.remove();
               });
           };

           // CHILD RELATED FUNCTIONS

           Dialog.prototype.getSelectedChildType = function () {
               var self = this;
               return $(self._childSelector).val();
           };

           Dialog.prototype.getSelectedChildMetaId = function () {
               var self = this;
               return self._childTypes[ self.getSelectedChildType() ];
           };

           Dialog.prototype.getCurrentMetaNode = function() {
               var self = this;
               return self.client.getNode( self.getSelectedChildMetaId() );
           };

           Dialog.prototype.selectChild = function (event) {
               var self = this;
               //var childSelect = event.target;
               //var newChildType = childSelect.options[ childSelect.selectedIndex ].textContent;
               self.renderChildForm();
           };

           Dialog.prototype.renderChildForm = function() {
               var self = this;
               self._attrForm.empty();
               self._attrForm.append( self.getForm() );
           };

           Dialog.prototype.getValidChildrenTypes = function( desc, client ) {
               var node = client.getNode( desc.id );
               var validChildTypes = {};

               // figure out what the allowable range is
               var validChildren = node.getValidChildrenTypesDetailed( );
               Object.keys( validChildren ).map(function( metaId ) {
                   var child = client.getNode( metaId );
                   var childType = child.getAttribute('name');
                   var canCreateMore = validChildren[ metaId ];
                   if ( canCreateMore &&
                        !child.isAbstract() &&
                        !child.isConnection() &&
                        ignoreTypes.indexOf( childType ) == -1 )
                       validChildTypes[ childType ] = metaId;
               });

               return validChildTypes;
           };

           // ATTRIBUTE RELATED FUNCTIONS

           Dialog.prototype.getCurrentAttributeNames = function () {
               var self = this;
               return self.getCurrentMetaNode().getAttributeNames().sort();
           };

           Dialog.prototype.getForm = function ( ) {
               var self = this;
               var form = '';
               var node = self.getCurrentMetaNode();
               self.getCurrentAttributeNames().map( function(a) {
                   form += self.renderAttributeForm( a, node.getAttributeMeta(a).type );
               });
               return form;
           };
           
           Dialog.prototype.renderAttributeForm = function ( attr, type ) {
               return mustache.render( attrForm, {
                   attr: attr,
                   id: attrToID(attr),
                   type: (typeMap[type] || type)
               } );
           };

           Dialog.prototype.getAttributesFromForm = function () {
               var self = this;
               var attr = {};
               self.getCurrentAttributeNames().map(function(a) {
                   var el = $(self._dialog).find('#'+attrToID(a)).first();
                   var type = el.type || (el[0] && el[0].type);
                   var val = valueMap[type] ? valueMap[type](el) : el.val();
                   attr[a] = val;
               });
               return attr;
           };

           /**
            * Update text in editor area
            * @param  {String} newtext [new text to replace old one]
            */
           Dialog.prototype.updateText = function (newtext) {
               this.text = newtext;
           };

           /**
            * Show actual text editor in its container by loading EpicEditor, this method
            * must be put into listener's callback function because its container is not appended
            * into DOM at this point and load() cannot access other DOM elements.
            * @return {void}
            */
           Dialog.prototype.show = function () {
               var self = this;
               self._dialog.modal('show');
           };

           return Dialog;
       });
