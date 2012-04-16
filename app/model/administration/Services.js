/**
 * Created by JetBrains PhpStorm.
 * User: Ernesto J. Rodriguez (Certun)
 * File:
 * Date: 2/18/12
 * Time: 11:09 PM
 */


Ext.define('App.model.administration.Services', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'id', type: 'int'},
		{name: 'code_text', type: 'string'},
		{name: 'code_text_short', type: 'string'},
		{name: 'code', type: 'string'},
		{name: 'code_type', type: 'string'},
		{name: 'modifier', type: 'string'},
		{name: 'units', type: 'string'},
		{name: 'fee', type: 'int'},
		{name: 'superbill', type: 'string'},
		{name: 'related_code', type: 'string'},
		{name: 'taxrates', type: 'string'},
		{name: 'cyp_factor', type: 'string'},
		{name: 'active', type: 'string'},
		{name: 'reportable', type: 'string'}
	]

});