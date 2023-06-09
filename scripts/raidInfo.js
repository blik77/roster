function getRaidInfo(name,realm){
    mainPanel.updateRaidInfo({expanded: true,children: []});
    Ext.Ajax.request({
        url: 'bnet_data.php',
        method: 'POST',
        params: { codex: 'getRaidInfo',name: name,realm: realm },
        success: function(response){
            if(response.responseText==="no"){
                
            } else {
                var content=JSON.parse(response.responseText);

                var arRaidsBlocked=[2717,2677,3429,3428,3457,3836,3923,3607,3845,3606,3959,4075,4603,3456,4493,4500,4273,2159,4722,4812,
                    4987,5600,5094,5334,5638,5723,5892,6125,6297,6067,6622,6738,6996,6967,7545,  8026,8440,8025,8524,8638];
                var children=[];
                var raids=content.progression.raids;
                var maxRaidID=0;
                raids.forEach(function(el,i,ar){if(el.id>maxRaidID){maxRaidID=el.id;}});
                raids.forEach(function(el,i,ar){
                    var flag=true;
                    arRaidsBlocked.forEach(function(el2,i2,ar2){
                        if(el2===el.id) flag=false;
                    });
                    if(flag){
                        var bosses=getListRaidBosses(el.bosses);
                        var status=['statusNO','statusInP','statusYES'];
                        if(bosses.length>0)
                            children.push({
                                text:el.name,expanded:el.id===maxRaidID?true:false,
                                isRaid: true,
                                isBoss: false,
                                lfr:el.lfr,
                                normal:el.normal,
                                heroic:el.heroic,
                                mythic:el.mythic,
                                children:bosses
                            });
                        else
                            children.push({
                                text:el.name,
                                isRaid: true,
                                isBoss: false,
                                lfr:el.lfr,
                                normal:el.normal,
                                heroic:el.heroic,
                                mythic:el.mythic,
                                leaf:true
                            });
                    }
                });
                mainPanel.updateRaidInfo({expanded: true,text: "My Root",children:children});
            }
        },
        failure: function(response){ }
    });
}
function createRaidInfo(){
    var panel=Ext.create('Ext.tree.Panel', {
        title: 'Прогресс персонажа',
        width: 480,
        region: 'east',
        split: true,
        collapsible: true,
        store: Ext.create('Ext.data.TreeStore', { root: { expanded: true,children: [] } }),
        rowLines: true,
        columnLines: true,
        rootVisible: false,
        columns: {
            defaults: {menuDisabled: true,sortable:false,resizable:false,
                renderer : function(value, meta, record){
                    if(meta.column.dataIndex==='text')return value;
                    if(record.getData()['isBoss'])return value;
                    //if(record.getData()['isRaid'])return value;
                    
                    if(record.getData()[meta.column.dataIndex]===0){ meta.tdCls+=' statusNO'; }
                    else if(record.getData()[meta.column.dataIndex]===1){ meta.tdCls+=' statusInP'; }
                    else if(record.getData()[meta.column.dataIndex]===2){ meta.tdCls+=' statusYES'; }
                    return '';
                }
            },
            items: [{
                xtype: 'treecolumn',
                text: 'Рейд',
                dataIndex: 'text',
                flex: 1
            },{
                text: 'ЛФР',
                dataIndex: 'lfr',
                width: 55, align: 'center'
            },{
                text: 'Нормал',
                dataIndex: 'normal',
                width: 55, align: 'center'
            },{
                text: 'Героик',
                dataIndex: 'heroic',
                width: 55, align: 'center'
            },{
                text: 'Мифик',
                dataIndex: 'mythic',
                width: 55, align: 'center'
            }]
        },
        updateRaidInfo: function(data){ this.getStore().setRoot(data);}
    });
    return panel;
}

function getListRaidBosses(bosses){
    var children=[];
    if(bosses.length>0){
        bosses.forEach(function(el,i,ar){
            children.push({
                text:el.name,
                isRaid: false,
                isBoss: true,
                lfr:el.lfrKills,
                normal:el.normalKills,
                heroic:el.heroicKills,
                mythic:el.mythicKills,
                leaf:true
            });
        });
    }
    return children;
}