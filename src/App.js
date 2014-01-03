Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'release',

    addContent: function() {
        this._makeStore();
    },
    
   onScopeChange: function() {
        console.log('onScopeChange');
        this._makeStore();
    },
    
    _makeStore: function(){
        Ext.create('Rally.data.WsapiDataStore', {
                model: 'DefectSuite',
                fetch: ['FormattedID', 'Defects', 'DefectStatus'],  
                pageSize: 100,
                autoLoad: true,
                filters: [this.getContext().getTimeboxScope().getQueryFilter()],
                listeners: {
                    load: this._onDefectSuitesLoaded,
                    scope: this
                }
            }); 
    },
     _onDefectSuitesLoaded: function(store, data){
        console.log('store...',store);
	console.log('data...',data);
        var defectSuites = [];
        var pendingDefects = data.length;
         console.log(data.length);
         if (data.length ===0) {
            this._createDefectSuitesGrid(defectSuites);  
         }
         Ext.Array.each(data, function(defectsuite){ 
            var ds  = {
                FormattedID: defectsuite.get('FormattedID'),   
                _ref: defectsuite.get('_ref'),  //required to make FormattedID clickable
                DefectStatus: defectsuite.get('DefectStatus'),
                DefectCount: defectsuite.get('Defects').Count,
                Defects: []
            };
            var defects = defectsuite.getCollection('Defects');
            defects.load({
                                fetch: ['FormattedID'],
                                callback: function(records, operation, success){
                                    Ext.Array.each(records, function(defect){
                                        ds.Defects.push({_ref: defect.get('_ref'),
                                                        FormattedID: defect.get('FormattedID')
                                                    });
                                    }, this);
                                    --pendingDefects;
                                    if (pendingDefects === 0) {
                                        this._createDefectSuitesGrid(defectSuites);
                                    }
                                },
                                scope: this
                            });
            defectSuites.push(ds);
     },this);
 },
    
      _createDefectSuitesGrid: function(defectsuites) {
        var defectSuiteStore = Ext.create('Rally.data.custom.Store', {
                data: defectsuites,
                pageSize: 100,  
            });
        if (!this.down('#defectsuitegrid')) {
         this.grid = this.add({
            xtype: 'rallygrid',
            itemId: 'defectsuitegrid',
            store: defectSuiteStore,
            columnCfgs: [
                {
                   text: 'Formatted ID', dataIndex: 'FormattedID', xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                },
                {
                    text: 'Defect Count', dataIndex: 'DefectCount',
                },
                {
                    text: 'Defect Status', dataIndex: 'DefectStatus',flex:1
                },
                {
                    text: 'Defects', dataIndex: 'Defects',flex:1, 
                    renderer: function(value) {
                        var html = [];
                        Ext.Array.each(value, function(defect){
                            html.push('<a href="' + Rally.nav.Manager.getDetailUrl(defect) + '">' + defect.FormattedID + '</a>')
                        });
                        return html.join(', ');
                    }
                }
            ]
        });
         }else{
            this.grid.reconfigure(defectSuiteStore);
         }
    }
});

