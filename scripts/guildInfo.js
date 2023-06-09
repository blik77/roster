function getGuildRoster(name_guild,name_realm){
    mainPanel.updateGuildRoster([]);
    mainPanel.updateGuildTitle('','');
    Ext.Ajax.request({
        url: 'bnet_data.php',
        method: 'POST',
        params: { codex: 'getGuildRoster',gname: encodeURIComponent(name_guild),realm: name_realm, minRank: minRank },
        success: function(response){
            if(response.responseText==="no"){
                Ext.Msg.show({
                    title: 'ERROR',
                    message: 'Не найдены записи в БД для этой гильдии. Найти гильдию в b-net?',
                    buttons: Ext.Msg.YESNO,
                    icon: Ext.Msg.QUESTION,
                    fn: function(btn){ if(btn==='yes'){ findGuildInBNET(name_guild,name_realm); } }
                });
            } else {
                var ans=JSON.parse(response.responseText);
                mainPanel.updateGuildTitle(name_guild,name_realm,ans[0].att_date_update,ans[0].guild_date_update);
                mainPanel.updateGuildRoster(ans);
            }
        },
        failure: function(response){ }
    });
}
function createGuildRoster(){
    var panel=Ext.create('Ext.grid.Panel', {
        name_guild: '',
        name_realm: '',
        title: 'Состав гильдии',
        width:830,
        region: 'west',
        plugins: { ptype: 'cellediting', clicksToEdit: 1 },
        store: Ext.create('Ext.data.Store', {
            fields:['name_char','name_realm','id_class','name_class','name_race','name_gender',{name: 'avg_ilvl',type: 'number'},'id_char','status_char','comment_char',
                    'lastModified','guild_rank','id_armor','name_armor','id_role','role','id_alt_role','alt_role',{name: 'date_invite', type: 'date'},'attendance','check',
                    'increase_rank','invite_raid','event_status'],
            data: []
        }),
        tools: [{
            type:'restore',
            tooltip: 'Состав гильдии.',
            callback: function(panel,tool,event){ createGuildCompositionWin(panel); }
        },{
            type:'collapse',
            tooltip: 'Загрузить историю лута.',
            callback: function(panel,tool,event){ createLoadLootWin(); }
        },{
            type:'expand',
            tooltip: 'Загрузить attendance.',
            callback: function(panel,tool,event){ createLoadAttendanceWin(); }
        },{
            type:'gear',
            tooltip: 'Полная синхронизация',
            callback: function(panel,tool,event){ fullSync(mainPanel.name_guild,mainPanel.name_realm); }
        },{
            type:'plus',
            tooltip: 'Поиск новичков',
            callback: function(panel,tool,event){ searchNewbie(mainPanel.name_guild,mainPanel.name_realm); }
        },{
            type:'refresh',
            tooltip: 'Обновить',
            callback: function(panel,tool,event){ mainPanel.runGetGuidRoster(); }
        }],
        columnLines: true,
        columns: [
            {xtype: 'rownumberer'},
            { xtype:'actioncolumn',menuDisabled: true,
                width:20,
                items: [{
                    iconCls: 'link_but',
                    tooltip: 'WOWPROGRESS',
                    handler: function(grid, rowIndex, colIndex) {
                        var rec=grid.getStore().getAt(rowIndex);
                        window.open("https://www.wowprogress.com/character/eu/"+rec.get('name_realm')+"/"+rec.get('name_char'), '_blank');
                    }
                }]
            },
            { text: 'Имя', dataIndex: 'name_char',width:100,menuDisabled: true },
            { text: 'Ранг', dataIndex: 'guild_rank',width:45,menuDisabled: true,align: 'center',renderer : function(value, meta, record){
                if(record.getData()['guild_rank']*1===-1){ meta.tdCls+=' statusNO'; return value*1; }
                else {
                    var increase_rank=record.getData()['increase_rank']*1;
                    switch(increase_rank){
                        case 3: meta.tdCls+=' statusYES'; break;
                        case 4: meta.tdCls+=' statusYES'; break;
                        case 5: meta.tdCls+=' statusYES'; break;
                        default: break;
                    }
                    return value*1+(increase_rank!==0?(" ("+record.getData()['increase_rank']*1+")"):"");
                }
            } },
            { text: 'Класс', dataIndex: 'name_class',width:125,menuDisabled: true,renderer : function(value, meta, record){
                switch(record.getData()['id_class']*1){
                    case 1: meta.tdCls+=' colorWarrior'; break;
                    case 2: meta.tdCls+=' colorPaladin'; break;
                    case 3: meta.tdCls+=' colorHunter'; break;
                    case 4: meta.tdCls+=' colorRogue'; break;
                    case 5: meta.tdCls+=' colorPriest'; break;
                    case 6: meta.tdCls+=' colorDeathKnight'; break;
                    case 7: meta.tdCls+=' colorShaman'; break;
                    case 8: meta.tdCls+=' colorMage'; break;
                    case 9: meta.tdCls+=' colorWarlock'; break;
                    case 10: meta.tdCls+=' colorMonk'; break;
                    case 11: meta.tdCls+=' colorDruid'; break;
                    case 12: meta.tdCls+=' colorDemonHunter'; break;
                    default: break;
                }
                return value;
            } },
            { text: 'Доспехи', dataIndex: 'name_armor',width:60,menuDisabled: true },
            { text: 'Статус', dataIndex: 'status_char',width:60,menuDisabled: true,renderer : function(value, meta, record){
                switch(record.getData()['status_char']){
                    case "в игре": meta.tdCls+=' statusInGame'; break;
                    case "домосед": meta.tdCls+=' statusHomeUser'; break;
                    case "запас": meta.tdCls+=' statusReserve'; break;
                    default: break;
                }
                return value;
            } },
            { text: 'iLVL', dataIndex: 'avg_ilvl',width:50,menuDisabled: true,renderer : function(value, meta, record){
                if(record.getData()['avg_ilvl']*1<minIlvl){ meta.tdCls+=' lowILVL'; }
                return value*1;
            } },
            { text: 'role', dataIndex: 'role',width:50,menuDisabled: true,renderer : function(value, meta, record){
                switch(record.getData()['id_role']*1){
                    case 1: meta.tdCls+=' roleTank'; break;
                    case 2: meta.tdCls+=' roleHealer'; break;
                    case 3: meta.tdCls+=' roleRDD'; break;
                    case 4: meta.tdCls+=' roleMDD'; break;
                    default: break;
                }
                return value;
            } },
            { text: 'a.role', dataIndex: 'alt_role',width:50,menuDisabled: true,renderer : function(value, meta, record){
                switch(record.getData()['id_alt_role']*1){
                    case 1: meta.tdCls+=' alt_roleTank'; break;
                    case 2: meta.tdCls+=' alt_roleHealer'; break;
                    case 3: meta.tdCls+=' alt_roleRDD'; break;
                    case 4: meta.tdCls+=' alt_roleMDD'; break;
                    default: break;
                }
                return value;
            } },
            { text: 'comment', dataIndex: 'comment_char',width:75,menuDisabled: true,renderer : function(value, meta, record){
                var textDays=" days ago";
                if(record.getData()['comment_char']*1>0){
                    if(record.getData()['guild_rank']*1>=5 && record.getData()['comment_char']*1>=30){ meta.tdCls+=' statusNO'; return value+textDays; }
                    else if(record.getData()['guild_rank']*1===4 && record.getData()['comment_char']*1>=45){ meta.tdCls+=' statusNO'; return value+textDays; }
                    else if(record.getData()['guild_rank']*1===3 && record.getData()['comment_char']*1>=60){ meta.tdCls+=' statusNO'; return value+textDays; }
                    else return value+textDays;
                }
                return "";
            } },
            { text: 'Принят', dataIndex: 'date_invite',width:70,menuDisabled: true, xtype: 'datecolumn', format:'d.m.Y' },
            { xtype:'actioncolumn',menuDisabled: true,
                width:20,
                items: [{
                    iconCls: 'edit_but',
                    tooltip: 'Редактировать',
                    handler: function(grid, rowIndex, colIndex) {
                        var rec=grid.getStore().getAt(rowIndex);
                        createUpdateWin(rec);
                    }
                }]
            },
            { text: 'R', dataIndex: 'check',width:20,menuDisabled: true,tooltip: 'Статус готовности к рейду',renderer : function(value, meta, record){
                switch(record.getData()['check']*1){
                    case -1: meta.tdCls+=' statusNO'; break;
                    case 0: meta.tdCls+=' statusInP'; break;
                    case 1: meta.tdCls+=' statusYES'; break;
                    default: break;
                }
                return "";
            } },
            { text: 'I', dataIndex: 'invite_raid',width:20,menuDisabled: true,tooltip: 'Статус инвайта в рейд',renderer : function(value, meta, record){
                switch(record.getData()['invite_raid']*1){
                    case 3: meta.tdCls+=' statusNO'; break;
                    case 2: meta.tdCls+=' statusInP'; break;
                    case 1: meta.tdCls+=' statusYES'; break;
                    default: break;
                }
                return "";
            } },
            { text: 'E', dataIndex: 'event_status',width:20,menuDisabled: true,tooltip: 'Статус ответа на событие',renderer : function(value, meta, record){
                switch(record.getData()['event_status']*1){
                    case 3: meta.tdCls+=' statusNO'; break;
                    case 2: meta.tdCls+=' statusInP'; break;
                    case 1: meta.tdCls+=' statusYES'; break;
                    default: break;
                }
                return "";
            } }
        ],
        listeners: {
            'select': function(grid,rec,ind){
                mainPanel.setSearchData(rec.get('name_char'),rec.get('name_realm').replace(' ','-'));
                mainPanel.getCharInfoPanel().getCharInfo();
            },
            'cellclick': function(view,td,cellindex,rec,tr,rowindex){
                if(cellindex===14){
                    var invite_raid=rec.get('invite_raid')*1;
                    if(invite_raid===1){ rec.set('invite_raid',2); }
                    else if(invite_raid===2){ rec.set('invite_raid',3); }
                    else if(invite_raid===3){ rec.set('invite_raid',1); }
                    
                    Ext.Ajax.request({
                        url: 'bnet_data.php',
                        method: 'POST',
                        params: { codex: 'updateInviteRaid',id_char: rec.get('id_char')*1,invite_raid: rec.get('invite_raid')*1 },
                        success: function(response){ },
                        failure: function(response){ }
                    });
                }
            }
        },
        updateGuildRoster: function(data){ this.getStore().loadData(data); }
    });
    return panel;
}
function createUpdateWin(rec){
    var roleCombo=Ext.create('Ext.form.ComboBox', {
        fieldLabel: 'Основная роль',
        editable: false,
        store: Ext.create('Ext.data.Store', {
            fields: ['id', 'name'],
            data: [{"id":0,"name":"НЕТ"},{"id":1,"name":"Танк"},{"id":2,"name":"Лекарь"},{"id":3,"name":"РДД"},{"id":4,"name":"МДД"}]
        }),
        queryMode: 'local',
        displayField: 'name',
        valueField: 'id',
        value: !!rec.get('id_role')?rec.get('id_role'):0
    });
    var alt_roleCombo=Ext.create('Ext.form.ComboBox', {
        fieldLabel: 'Альтернативная роль',
        editable: false,
        store: Ext.create('Ext.data.Store', {
            fields: ['id', 'name'],
            data: [{"id":0,"name":"НЕТ"},{"id":1,"name":"Танк"},{"id":2,"name":"Лекарь"},{"id":3,"name":"РДД"},{"id":4,"name":"МДД"}]
        }),
        queryMode: 'local',
        displayField: 'name',
        valueField: 'id',
        value: !!rec.get('id_alt_role')?rec.get('id_alt_role'):0
    });
    var date_inviteField=Ext.create('Ext.form.field.Date', {
        fieldLabel: 'Дата принятия',
        //editable: false,
        name: 'from_date',
        format: 'd.m.Y',
        maxValue: new Date(),
        value: rec.get('date_invite')
    });
    var win=Ext.create('Ext.window.Window', {
        title: 'Данные персонажа: '+rec.get('name_char')+"-"+rec.get('name_realm'),
        resizable: false,
        modal: true,
        defaults: {margin: 10},
        buttons: [
            {text: 'Сохранить', handler: function(){
                Ext.Ajax.request({
                    url: 'bnet_data.php',
                    method: 'POST',
                    params: { codex: 'updateCharacter',id_char:rec.get('id_char'),id_role:roleCombo.getValue(),id_alt_role:alt_roleCombo.getValue(),date_invite:date_inviteField.getRawValue() },
                    success: function(response){
                        rec.set('id_role',roleCombo.getValue());
                        rec.set('role',roleCombo.getRawValue());
                        rec.set('id_alt_role',alt_roleCombo.getValue());
                        rec.set('alt_role',alt_roleCombo.getRawValue());
                        rec.set('date_invite',date_inviteField.getRawValue());
                        win.close();
                    },
                    failure: function(response){ }
                });
            } },
            {text: 'Закрыть', handler: function(){ win.close(); } }
        ],
        items: [roleCombo,alt_roleCombo,date_inviteField]
    }).show();
}
function createLoadAttendanceWin(){
    var idGuildField=Ext.create('Ext.form.field.Text', {
        fieldLabel: 'id Гильдии на warcraftlogs',
        labelWidth: 150,
        value: 248424
    });
    var idGroupField=Ext.create('Ext.form.field.Text', {
        fieldLabel: 'id Группы на warcraftlogs',
        labelWidth: 150,
        value: 6821
    });
    var win=Ext.create('Ext.window.Window', {
        title: 'Загрузка attendance',
        resizable: false,
        modal: true,
        defaults: {margin: 10},
        tools: [{
            type:'gear',
            tooltip: 'Настройка логов.',
            callback: function(panel,tool,event){ window.open("https://www.warcraftlogs.com/guilds/teamattendance/"+idGroupField.getValue(), '_blank'); }
        }],
        buttons: [
            {text: 'Загрузить', handler: function(){
                var idGuild=idGuildField.getValue();
                var idGroup=idGroupField.getValue();
                if(!!mainPanel.name_guild && !!mainPanel.name_realm && !!idGuild && !!idGroup){
                    Ext.Ajax.request({
                        url: 'bnet_data.php',
                        method: 'POST',
                        params: { codex: 'updateAttendance',gname:mainPanel.name_guild,realm:mainPanel.name_realm,id_guild:idGuild,id_group:idGroup },
                        success: function(response){
                            if(response.responseText==="no1"){
                                Ext.Msg.alert('Статус','Гильдия не найдена.');
                            } else if(response.responseText==="no2"){
                                Ext.Msg.alert('Статус','Неправильные id аттенданса.');
                            } else if(response.responseText==="no3"){
                                Ext.Msg.alert('Статус','Совпадений не найдено.');
                            } else if(response.responseText==="yes"){
                                Ext.Msg.alert('Статус','Аттенданс обновлен.');
                            } else {
                                Ext.Msg.alert('Статус','Ошибка поиска.');
                            }
                        },
                        failure: function(response){ }
                    });
                    win.close();
                }
            } },
            {text: 'Закрыть', handler: function(){ win.close(); } }
        ],
        items: [idGuildField,idGroupField]
    }).show();
}
function createLoadLootWin(){
    var lootHistoryField=Ext.create('Ext.form.field.TextArea', {
        width: 750,
        height:500
    });
    var win=Ext.create('Ext.window.Window', {
        title: 'Загрузка истории лута',
        resizable: false,
        modal: true,
        defaultFocus: lootHistoryField,
        buttons: [
            {text: 'Загрузить', handler: function(){
                var textLootHistory=lootHistoryField.getValue();
                if(!!textLootHistory){
                    Ext.Ajax.request({
                        url: 'bnet_data.php',
                        method: 'POST',
                        params: { codex: 'loadLootHistory',text:textLootHistory.replace(/\n/g,",") },
                        success: function(response){
                            if(response.responseText==="no"){
                                Ext.Msg.alert('Статус','История не загружена.');
                            } else if(response.responseText==="yes"){
                                Ext.Msg.alert('Статус','История загружена.');
                            } else {
                                Ext.Msg.alert('Статус','Ошибка поиска.');
                            }
                        },
                        failure: function(response){ }
                    });
                    win.close();
                }
            } },
            {text: 'Закрыть', handler: function(){ win.close(); } }
        ],
        items: [lootHistoryField]
    }).show();
}
function createGuildCompositionWin(panel){
    var arRec=panel.getStore().getRange();
    var all=arRec.length;
    if(all===0){ return false; }
    var ready=0;
    var reserve=0;
    
    var readyAr=[];
    var classAr=[{name:'Воин',count:0,css:'colorWarrior',roles:[0,-1,-1,0]},
        {name:'Паладин',count:0,css:'colorPaladin',roles:[0,0,-1,0]},
        {name:'Охотник',count:0,css:'colorHunter',roles:[-1,-1,0,0]},
        {name:'Разбойник',count:0,css:'colorRogue',roles:[-1,-1,-1,0]},
        {name:'Жрец',count:0,css:'colorPriest',roles:[-1,0,0,-1]},
        {name:'Рыцарь смерти',count:0,css:'colorDeathKnight',roles:[0,-1,-1,0]},
        {name:'Шаман',count:0,css:'colorShaman',roles:[-1,0,0,0]},
        {name:'Маг',count:0,css:'colorMage',roles:[-1,-1,0,-1]},
        {name:'Чернокнижник',count:0,css:'colorWarlock',roles:[-1,-1,0,-1]},
        {name:'Монах',count:0,css:'colorMonk',roles:[0,0,-1,0]},
        {name:'Друид',count:0,css:'colorDruid',roles:[0,0,0,0]},
        {name:'Охотник на демонов',count:0,css:'colorDemonHunter',roles:[0,-1,-1,0]}];
    var roleAr=[{name:'танк',count:0,css:'roleTank'},{name:'лекарь',count:0,css:'roleHealer'},{name:'рдд',count:0,css:'roleMDD'},{name:'мдд',count:0,css:'roleRDD'}];
    var armorAr=[{name:'ткань',count:0},{name:'кожа',count:0},{name:'кольчуга',count:0},{name:'латы',count:0}];

    var token1=0;//пал/жрец/лок/ДХ
    var token2=0;//ДК/друид/маг/рога
    var token3=0;//хант/монах/шаман/воин
    
    arRec.forEach(function(el,i,ar){
        if(el.get('status_char')==="в игре"){
            ready+=1;
            readyAr.push(el);
        } else if(el.get('status_char')==="запас"){
            reserve+=1;
        }
    });
    readyAr.forEach(function(el,i,ar){
        var id_class=el.get('id_class')*1;
        var id_role=el.get('id_role')*1;
        var id_armor=el.get('id_armor')*1;
        
        classAr[id_class-1].count++;
        classAr[id_class-1].roles[id_role-1]++;
        roleAr[id_role-1].count++;
        armorAr[id_armor-1].count++;
        
        if([2,5,9,12].indexOf(id_class)!==-1){
            token1+=1;
        } else if([6,11,8,4].indexOf(id_class)!==-1){
            token2+=1;
        } else if([3,10,7,1].indexOf(id_class)!==-1){
            token3+=1;
        }
    });
    var textAll='<div class="statDiv"><span>Всего</span><table border=1 class="tableStat"><tr><td>Всего</td><td>'+all+'</td></tr><tr><td>Готовы</td><td class="statusInGame">'+ready+'</td></tr><tr><td>Запас</td><td class="statusReserve">'+reserve+'</td></tr></table></div>';
    
    var textToken='<div class="statDiv"><span>Токены</span><table border=1 class="tableStat"><tr><td>пал/жрец/лок/ДХ</td><td>'+token1+'</td></tr><tr><td>ДК/друид/маг/рога</td><td>'+token2+'</td></tr><tr><td>хант/монах/шаман/воин</td><td>'+token3+'</td></tr></table></div>';
    
    var textClass='<div class="statDiv"><span>Классы</span><table border=1 class="tableStat">';
    var textClassRole='<div class="statDiv"><span>Класс - Роль</span><table border=1 class="tableStat">';
    classAr.forEach(function(el,i,ar){
        textClass+='<tr><td class="'+el.css+'">'+el.name+'</td><td>'+el.count+'</td></tr>';
        el.roles.forEach(function(elR,j,arR){
            if(elR!==-1){
                textClassRole+='<tr><td class="'+el.css+'">'+el.name+' '+roleAr[j].name+'</td><td>'+elR+'</td></tr>';
            }
        });
    });
    textClass+='</table></div>';
    textClassRole+='</table></div>';
    
    var textRole='<div class="statDiv"><span>Роли</span><table border=1 class="tableStat">';
    roleAr.forEach(function(el,i,ar){
        textRole+='<tr><td class="'+el.css+'">'+el.name+'</td><td>'+el.count+'</td></tr>';
    });
    textRole+='</table></div>';
    
    var textArmor='<div class="statDiv"><span>Броня</span><table border=1 class="tableStat">';
    armorAr.forEach(function(el,i,ar){
        textArmor+='<tr><td>'+el.name+'</td><td>'+el.count+'</td></tr>';
    });
    textArmor+='</table></div>';
    
    var win=Ext.create('Ext.window.Window', {
        title: 'Состав гильдии',
        width: 700,
        height: 600,
        bodyPadding: 5,
        resizable: false,
        modal: true,
        buttons: [{text: 'Закрыть', handler: function(){ win.close(); } }],
        hmtl: ''
    }).show();
    win.setHtml('<div class="statDiv"><div>'+textAll+textToken+'</div><div>'+textRole+textArmor+'</div><div>'+textClass+'</div></div>'+textClassRole,false);
}

function findGuildInBNET(name_guild,name_realm){
    Ext.Ajax.request({
        url: 'bnet_data.php',
        method: 'POST',
        params: { codex: 'preSyncGuild',gname: encodeURIComponent(name_guild),realm: name_realm },
        success: function(response){
            if(response.responseText==="no"){
                Ext.Msg.alert('Статус','Гильдия не найдена.');
            } else if(response.responseText==="yes"){
                Ext.Msg.show({
                    title: 'Статус',
                    message: 'Гильдия найдена. Синхронизировать?',
                    buttons: Ext.Msg.YESNO,
                    icon: Ext.Msg.QUESTION,
                    fn: function(btn){ if(btn==='yes'){ syncGuild(name_guild,name_realm,false); } }
                });
            } else { Ext.Msg.alert('Статус','Ошибка поиска.'); }
        },
        failure: function(response){ }
    });
}
function syncGuild(name_guild,name_realm,flag_newbie){
    var codex='syncGuild';
    if(flag_newbie){ var codex='searchNewbie'; }
    
    Ext.Ajax.request({
        url: 'bnet_data.php',
        method: 'POST',
        params: { codex: codex,gname: encodeURIComponent(name_guild),realm: name_realm },
        success: function(response){ },
        failure: function(response){ }
    });
    mainPanel.updateGuildTitle(name_guild,name_realm);
    Ext.Msg.alert('Статус','Заявка на синхронизацию отправлена.');
}
function fullSync(name_guild,name_realm){
    if(name_guild==='' || name_realm==='' || !!!name_guild || !!!name_realm){ return false; }
    Ext.Msg.show({
        title: 'Статус',
        message: 'Синхронизировать?',
        buttons: Ext.Msg.YESNO,
        icon: Ext.Msg.QUESTION,
        fn: function(btn){ if(btn==='yes'){ syncGuild(name_guild,name_realm,false); } }
    });
}
function searchNewbie(name_guild,name_realm){
    if(name_guild==='' || name_realm==='' || !!!name_guild || !!!name_realm){ return false; }
    Ext.Msg.show({
        title: 'Статус',
        message: 'Найти новичков?',
        buttons: Ext.Msg.YESNO,
        icon: Ext.Msg.QUESTION,
        fn: function(btn){ if(btn==='yes'){ syncGuild(name_guild,name_realm,true); } }
    });
}

function getClassName(id){
    var arClassName=["","Воин","Паладин","Охотник","Разбойник","Жрец","Рыцарь смерти","Шаман","Маг","Чернокнижник","Монах","Друид","Охотник на демонов"];
    return arClassName[id*1];
}
function getRaceName(id){
    var arRaceName=["","Человек","Орк","Дворф","Ночной эльф","Нежить","Таурен","Гном","Тролль","Гоблин","Эльф крови","Дреней"];
    arRaceName[22]="Ворген";arRaceName[24]="Пандарен";arRaceName[25]="Пандарен";arRaceName[26]="Пандарен";
    return arRaceName[id*1];
}
function getGenderName(id){
    var arGenderName=["Мужчина","Женщина"];
    return arGenderName[id*1];
}
function getRankName(id){
    var arRankName=["(0) Избранник КТуна","(1) Оракул КТуна","(2) Поборник КТуна","(3) Чемпион Тьмы","(4) Сеятель Тьмы","(5) Агент бездны","(6) Неофит","(7) Аколит","(8) Жертва","(9) Безликий"];
    return arRankName[id*1];
}

function scanEvents(){
    var dateEvent=Ext.create('Ext.form.field.Date', {
        region: 'north',
        fieldLabel: 'Дата события',
        value: new Date()
    });
    var resParse=Ext.create('Ext.panel.Panel', {
        region: 'center',
        flex: 1,
        scrollable: true
    });
    var inputParse=Ext.create('Ext.form.field.TextArea', {
        region: 'center',
        flex: 1,
        parseStr: "",
        listeners: {
            'change': function(ta,nv,ov,e){
                ta.parseStr=nv.replace(/^ /,"");
                ta.parseStr=ta.parseStr.replace(/  /igm," ");
                ta.parseStr=ta.parseStr.replace(/\n /igm,"#");
                ta.parseStr=ta.parseStr.replace(/под вопросом/igm,"под_вопросом");
                ta.parseStr=ta.parseStr.replace(/\n/igm,"$");
                ta.parseStr=ta.parseStr.replace(/\s/igm,"$");
                var tempAr=ta.parseStr.split("#");
                var ans=[];
                tempAr.forEach(function(el,ind,ar){
                    ans.push(el.replace("$"," - "));
                });
                resParse.setHtml(ans.join('<br>'));
            }
        }
    });
    var win=Ext.create('Ext.window.Window', {
        title: 'Загрузить список участников события '+gname+' [ '+realm+' ]',
        height: 500,
        width: 700,
        layout: 'border',
        defaultFocus : inputParse,
        modal: true,
        items: [Ext.create('Ext.panel.Panel', {
            region: 'west',
            flex: 1,
            layout: 'border',
            items: [dateEvent,resParse]
        }),inputParse],
        buttons: [{
            text: 'Сохранить',
            handler: function(){
                Ext.Ajax.request({
                    url: 'bnet_data.php',
                    method: 'POST',
                    params: { codex: 'scanEvents', parseStr: inputParse.parseStr, gname: gname, realm: realm, date: dateEvent.getRawValue() },
                    success: function(response){
                        Ext.Msg.alert('Статус','Событие обновлено.');
                        win.close();
                    },
                    failure: function(response){
                        Ext.Msg.alert('Статус','Ошибка.');
                    }
                });
            }
        }]
    }).show();
    window.open('https://eu.battle.net/wow/ru/vault/character/event', '_blank');
}