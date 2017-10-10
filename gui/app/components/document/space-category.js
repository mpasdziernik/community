// Copyright 2016 Documize Inc. <legal@documize.com>. All rights reserved.
//
// This software (Documize Community Edition) is licensed under
// GNU AGPL v3 http://www.gnu.org/licenses/agpl-3.0.en.html
//
// You can operate outside the AGPL restrictions by purchasing
// Documize Enterprise Edition and obtaining a commercial license
// by contacting <sales@documize.com>.
//
// https://documize.com

import Ember from 'ember';
import TooltipMixin from '../../mixins/tooltip';
import NotifierMixin from '../../mixins/notifier';

export default Ember.Component.extend(TooltipMixin, NotifierMixin, {
    documentService: Ember.inject.service('document'),
	categoryService: Ember.inject.service('category'),
	sessionService: Ember.inject.service('session'),
	categories: [],
	hasCategories: Ember.computed('categories', function() {
		return this.get('categories').length > 0;
	}),
	canSelectCategory: Ember.computed('categories', function() {
		return (this.get('categories').length > 0 && this.get('permissions.documentEdit'));
	}),
	canAddCategory: Ember.computed('categories', function() {
		return this.get('permissions.spaceOwner') || this.get('permissions.spaceManage');
	}),

	init() {
		this._super(...arguments);
	},

	didReceiveAttrs() {
		this._super(...arguments);
		this.load();
	},

	load() {
		this.get('categoryService').getUserVisible(this.get('folder.id')).then((categories) => {
			this.set('categories', categories);
			this.get('categoryService').getDocumentCategories(this.get('document.id')).then((selected) => {
				this.set('selectedCategories', selected);
				selected.forEach((s) => {
					let cats = this.set('categories', categories);
					let cat = categories.findBy('id', s.id);
					if (is.not.undefined(cat)) {
						cat.set('selected', true);
						this.set('categories', cats);
					}
				});
			});
		});
	},

    actions: {
		onSave() {
			let docId = this.get('document.id');
			let folderId = this.get('folder.id');
			let link = this.get('categories').filterBy('selected', true);
			let unlink = this.get('categories').filterBy('selected', false);
			let toLink = [];
			let toUnlink = [];

			// prepare links associated with document
			link.forEach((l) => {
				let t = {
					folderId: folderId,
					documentId: docId,
					categoryId: l.get('id')
				};

				toLink.push(t);
			});

			// prepare links no longer associated with document
			unlink.forEach((l) => {
				let t = {
					folderId: folderId,
					documentId: docId,
					categoryId: l.get('id')
				};

				toUnlink.pushObject(t);
			});

			this.get('categoryService').setCategoryMembership(toUnlink, 'unlink').then(() => {
				this.get('categoryService').setCategoryMembership(toLink, 'link').then(() => {
					this.load();
				});
			});

			return true;
		}
    }
});