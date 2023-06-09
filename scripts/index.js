Ext.tip.QuickTipManager.init();
var mainPanel;
var realm='Азурегос';
var gname='Зов КТуна';
var minRank=6;
var minIlvl=330;

Ext.onReady(function(){ viewPage(); });

function viewPage(){
    Ext.Ajax.on('beforerequest',function(conn,opt){
        if(opt.url.indexOf('mainsource')===-1) Ext.getBody().mask("Загрузка");
    }, Ext.getBody());
    Ext.Ajax.on('requestcomplete',function(){ Ext.getBody().unmask(); } ,Ext.getBody());
    Ext.Ajax.on('requestexception',function(){ Ext.getBody().unmask(); }, Ext.getBody());
    
    var linkToWarLogs='https://www.warcraftlogs.com/search/?term=';
    var linkToStat='https://docs.google.com/spreadsheets/d/19iYnw5c20Nuvdlxa1V2uFJft6XN09JuPXYyoDrHPTFY';
    var linkToWP='https://www.wowprogress.com/guild/eu/';
    var linkToWT='https://wowtrack.org/?q=';
    var linkToEvents='https://eu.battle.net/wow/ru/vault/character/event';
    
    var guildName=Ext.create('Ext.form.field.Text', {
        fieldLabel: 'Имя',
        labelWidth: 30,
        width: 150,
        value: gname,
        allowBlank: false,
        listeners: {
            'change': function(t,nv,ov){ gname=nv; }
        }
    });
    var realmName=Ext.create('Ext.form.ComboBox', {
        fieldLabel: 'Сервер',
        labelWidth: 50,
        width: 175,
        padding: '0 10 0 10',
        editable: false,
        store: Ext.create('Ext.data.Store', {
            fields: ['id', 'name'],
            data : [
                {"id":"Азурегос", "name":"Азурегос"},
                {"id":"Борейская-тундра", "name":"Борейская тундра"},
                {"id":"Вечная-Песня", "name":"Вечная Песня"},
                {"id":"Галакронд", "name":"Галакронд"},
                {"id":"Голдринн", "name":"Голдринн"},
                {"id":"Гордунни", "name":"Гордунни"},
                {"id":"Гром", "name":"Гром"},
                {"id":"Дракономор", "name":"Дракономор"},
                {"id":"Король-лич", "name":"Король-лич"},
                {"id":"Пиратская-Бухта", "name":"Пиратская Бухта"},
                {"id":"Подземье", "name":"Подземье"},
                {"id":"Разувий", "name":"Разувий"},
                {"id":"Ревущий-фьорд", "name":"Ревущий фьорд"},
                {"id":"Свежеватель-Душ", "name":"Свежеватель Душ"},
                {"id":"Седогрив", "name":"Седогрив"},
                {"id":"Страж-смерти", "name":"Страж смерти"},
                {"id":"Термоштепсель", "name":"Термоштепсель"},
                {"id":"Ткач Смерти", "name":"Ткач Смерти"},
                {"id":"Черный-Шрам", "name":"Черный Шрам"},
                {"id":"Ясеневый-лес", "name":"Ясеневый лес"}
            ]
        }),
        queryMode: 'local',
        displayField: 'name',
        valueField: 'id',
        value: realm==='none'?'':realm,
        listeners: {
            'change': function(t,nv,ov){ realm=nv; }
        }
    });
    var minRankCombo=Ext.create('Ext.form.ComboBox', {
        fieldLabel: 'min Ранг',
        labelWidth: 60,
        width: 100,
        padding: '0 10 0 10',
        editable: false,
        store: Ext.create('Ext.data.Store', {
            fields: ['id', 'name'],
            data: [{"id":0,"name":0},{"id":1,"name":1},{"id":2,"name":2},{"id":3,"name":3},{"id":4,"name":4},
                    {"id":5,"name":5},{"id":6,"name":6},{"id":7,"name":7},{"id":8,"name":8},{"id":9,"name":9}]
        }),
        queryMode: 'local',
        displayField: 'name',
        valueField: 'id',
        value: minRank,
        listeners: {
            'change': function(cb,nv,ov){ minRank=nv; getGuildRoster(gname,realm); }
        }
    });
    var butNewSearch=Ext.create('Ext.Button', { text: 'GO', style: {borderColor: 'black'}, handler: function(){ mainPanel.runGetGuidRoster(); } });
    var butLinkToWarLogs=Ext.create('Ext.Button', { text: 'WARCRAFT LOGS', style: {borderColor: 'black'}, handler: function() { window.open(linkToWarLogs+guildName.getValue(), '_blank'); } });
    var butLinkToStat=Ext.create('Ext.Button', { text: 'GOOGLE EXCEL', style: {borderColor: 'black'}, handler: function() { window.open(linkToStat, '_blank'); } });
    var butLinkToWP=Ext.create('Ext.Button', { text: 'WOWPROGRESS', style: {borderColor: 'black'}, handler: function() { window.open(linkToWP+realmName.getValue()+"/"+guildName.getValue()+"/", '_blank'); } });
    var butLinkToWT=Ext.create('Ext.Button', { text: 'WOWTRACK', style: {borderColor: 'black'}, handler: function() { window.open(linkToWT+guildName.getValue(), '_blank'); } });
    var butLinkToEvents=Ext.create('Ext.Button', { text: 'EVENTS', style: {borderColor: 'black'}, handler: function() { window.open(linkToEvents, '_blank'); } });
    var butLinkToScanEvents=Ext.create('Ext.Button', { text: 'SCAN EVENTS', style: {borderColor: 'black'}, handler: function() { scanEvents(); } });
    
    guildRoster=createGuildRoster();
    charInfo=createCharInfo();
    raidInfo=createRaidInfo();
    
    mainPanel=Ext.create('Ext.Panel', {
        name_guild: '',
        name_realm: '',
        bodyPadding: 5,
        layout: 'border',
        tbar: [guildName,realmName,minRankCombo,butNewSearch,'-',butLinkToWP,'-',butLinkToWT,'-',butLinkToWarLogs,'-',butLinkToScanEvents,'->',butLinkToEvents,'-',butLinkToStat],
        items: [guildRoster,charInfo,raidInfo],
        setSearchData: function(name,realm){ charInfo.setSearchData(name,realm); },
        getGuildRosterPanel: function(){ return guildRoster; },
        getCharInfoPanel: function(){ return charInfo; },
        getRaidInfoPanel: function(){ return raidInfo; },
        updateGuildRoster: function(data){ guildRoster.updateGuildRoster(data); },
        updateCharInfo: function(data){ charInfo.updateCharInfo(data); },
        updateRaidInfo: function(data){ raidInfo.updateRaidInfo(data); },
        updateGuildTitle: function(name_guild,name_realm,att_date_update,guild_date_update){
            mainPanel.name_guild=name_guild;
            mainPanel.name_realm=name_realm;
            guildRoster.setTitle('Состав гильдии'+
                    (name_guild!==''?' "'+name_guild+'-'+name_realm+'"':'')+
                    (!!att_date_update?(' [att.upd: '+att_date_update)+']':'')+
                    (!!guild_date_update?(' [guild.upd: '+guild_date_update)+']':''));
        },
        runGetGuidRoster: function(){
            var gname_new=guildName.getValue();
            var realm_new=realmName.getValue();
            if(!!!gname_new || !!!realm_new) { return; }
            getGuildRoster(gname_new,realm_new);
        },
        updateCharLootHistory: function(data){ charInfo.updateCharLootHistory(data); }
    });
    
    Ext.create('Ext.container.Viewport', { items: [mainPanel], layout: 'fit' });
    
    mainPanel.runGetGuidRoster();
}