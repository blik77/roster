function getCharInfo(name,name_realm){
    mainPanel.updateCharInfo('');
    mainPanel.updateCharLootHistory('');
    getCharLootHistory(name,name_realm);
    Ext.Ajax.request({
        url: 'bnet_data.php',
        method: 'POST',
        params: { codex: 'getCharInfo',name: name,realm: name_realm },
        success: function(response){
            if(response.responseText==="no"){
                Ext.Msg.show({
                    title: 'ERROR',
                    message: 'Не найдены записи в БД для этого персонажа. Найти его в b-net?',
                    buttons: Ext.Msg.YESNO,
                    icon: Ext.Msg.QUESTION,
                    fn: function(btn){ if(btn==='yes'){ findCharInBNET(name,name_realm); } }
                });
            } else { mainPanel.updateCharInfo(buildText(response.responseText)); }
        },
        failure: function(response){ }
    });
}
function getCharLootHistory(name,name_realm){
    Ext.Ajax.request({
        url: 'bnet_data.php',
        method: 'POST',
        params: { codex: 'getCharLootHistory',name: name,realm: name_realm },
        success: function(response){
            mainPanel.updateCharLootHistory(response.responseText);
        },
        failure: function(response){ }
    });
}
function buildText(data){
    var content=JSON.parse(data);
    
    var left="",right="";
    content.data.forEach(function(item,i,arr) {
        if(i<content.data.length-8){ left+=createSlotInfo(item); }
        else { right+=createSlotInfo(item); }
    });

    var center='<table>'+
'<tr><td align="center"><img src="http://render-eu.worldofwarcraft.com/character/'+content.icon_char.replace('avatar',document.body.clientWidth>1230?'inset':'avatar')+'"></td></tr>'+
'<tr><td>Уровень предметов: <b>'+content.avg_ilvl+'</b></td></tr>'+
'<tr><td>(gems/enchant)</b></td></tr>'+
'</table>';
    var text='<div style="text-align: center;">'+
'<div class="charDiv"><table class="charTable">'+left+'</table></div>'+
'<div class="charDiv"><table class="charTable">'+center+'</table></div>'+
'<div class="charDiv"><table class="charTable">'+right+'</table></div></div>';
    return text;
}
function createCharInfo(){
    var labelCharInfo=Ext.create('Ext.form.Label',{ });
    var charName=Ext.create('Ext.form.field.Text', {
        fieldLabel: 'Имя',
        labelWidth: 30,
        width: 150
    });
    var realmName=Ext.create('Ext.form.ComboBox', {
        fieldLabel: 'Сервер',
        labelWidth: 50,
        width: 175,
        padding: '0 0 0 10',
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
        value: realm==='none'?'':realm
    });
    var butLinkToWP=Ext.create('Ext.Button', { text: 'WP', style: {borderColor: 'black'}, handler: function() {
        var name=charName.getValue();
        var realm_new=realmName.getValue();
        if(!!!name || !!!realm_new) { return; }
        var link='https://www.wowprogress.com/character/eu/'+realm_new+'/'+name+'/';
        window.open(link, '_blank'); }
    });
    var butLinkToArmory=Ext.create('Ext.Button', { text: 'ARMORY', style: {borderColor: 'black'}, handler: function() {
        var name=charName.getValue();
        var realm_new=realmName.getValue();
        if(!!!name || !!!realm_new) { return; }
        var link='http://eu.battle.net/wow/character/'+realm_new+'/'+name+'/';
        window.open(link, '_blank'); }
    });
    var butNewSearch=Ext.create('Ext.Button', { text: 'GO', style: {borderColor: 'black'}, handler: function() {
        var name=charName.getValue();
        var realm_new=realmName.getValue();
        if(!!!name || !!!realm_new) { return; }
        panel.getCharInfo(name,realm_new);
    } });
    var charInfoPanel=Ext.create('Ext.panel.Panel', {
        items: [labelCharInfo],
        border: false,
        height: 350
    });
    var lootHistoryPanel=Ext.create('Ext.panel.Panel', {
        title: 'История лута',
        border: false,
        flex: 1,
        scrollable: true
    });
    var panel=Ext.create('Ext.panel.Panel', {
        title: 'Информация о персонаже',
        flex: 1,
        region: 'center',
        layout: { type: 'vbox', pack: 'start', align: 'stretch' },
        tools: [{
            type:'refresh',
            tooltip: 'Обновить из b-net.',
            callback: function(panel,tool,event){ findCharInBNET(charName.getValue(),realmName.getValue()); }
        }],
        tbar: [charName,realmName,butNewSearch,'->',butLinkToWP,'-',butLinkToArmory],
        items: [charInfoPanel/*,lootHistoryPanel*/],
        updateCharInfo: function(data){ labelCharInfo.setText(data,false); },
        setSearchData: function(name,realm){
            charName.setValue(name);
            realmName.setValue(realm);
        },
        getCharInfo: function(){
            var name=charName.getValue();
            var realm_new=realmName.getValue();
            if(!!!name || !!!realm_new) { return; }
            getCharInfo(name,realm_new);
            getRaidInfo(name,realm_new);
        },
        updateCharLootHistory: function(data){
            lootHistoryPanel.setHtml(data,false);
        }
    });
    return panel;
}

function findCharInBNET(name,name_realm){
    if(!!!name || !!!name_realm){ return false; }
    Ext.Ajax.request({
        url: 'bnet_data.php',
        method: 'POST',
        params: { codex: 'preSyncChar',name: name,realm: name_realm },
        success: function(response){
            if(response.responseText==="no"){
                Ext.Msg.alert('Статус','Персонаж не найден.');
            } else { mainPanel.updateCharInfo(buildText(response.responseText)); }
        },
        failure: function(response){ }
    });
}

function createSlotInfo(item){
    return '<tr>'+
'<td style="padding: 3px; background-color:'+getColorItem(item)+';"><a href="http://ru.wowhead.com/item='+item.id_item+'&'+getBonus(item.bonus)+'" '+buildRel(item)+' target="_blank"><img src="https://wow.zamimg.com/images/wow/icons/medium/'+item.icon_item+'.jpg"></img></a></td>'+
'<td align="center" style="background-color:'+(!!getPcs(item)?'lightblue':'white')+';">'+item.ilvl+'</td>'+
'<td align="center" style="width: 10px; height: 10px; background-color: '+getQualityGem(item)+';"></td>'+
'<td align="center" style="width: 10px; height: 10px; background-color: '+getQualityEnch(item)+';"></td>'+
'</tr>';

/*
http://media.blizzard.com/wow/icons/56/inv_helm_mail_raidhunter_q_01.jpg
main.:profilemain:inset:avatar
*/
}
function getColorItem(item){
    switch(item.quality*1){
        case 0: return '#9d9d9d';
        case 1: return '#ffffff';
        case 2: return '#1eff00';
        case 3: return '#0070dd';
        case 4: return '#9345ff';
        case 5: return '#ff8000';
        case 6: return '#e5cc80';
        case 7: return '#00ccff';
        case 8: return '#00ccff';
        default: return 'white';
    }
}
function buildRel(data){
    var rel=[];
    var bonus=getBonus(data.bonusLists);
    if(!!bonus)rel.push(bonus);
    var gem=getGem(data);
    if(!!gem)rel.push(gem);
    var chant=getChant(data);
    if(!!chant)rel.push(chant);
    var pcs=getPcs(data);
    if(!!pcs)rel.push(pcs);
    if(rel.length>0) return 'rel="'+rel.join('&amp;')+'"';
    else return '';
}
function getBonus(bonus){
    if(!!bonus){ return "bonus="+bonus.replace(/,/g,":"); }
    return "";
}
function getGem(data){
    if(!!data.gems){ return "gems="+data.gems.replace(/,/g,":"); }
    return "";
}
function getChant(data){
    if(!!data.enchant){ return "ench="+data.enchant.replace(/,/g,":"); }
    return "";
}
function getPcs(data){
    if(!!data.set_pcs){
        if(data.set_pcs.split(",").length<2){ return ""; }
        return "set_pcs="+data.set_pcs.replace(/,/g,":");
    }
    return "";
}
function getQualityGem(data){
    var best=[153709,153708,153707];
    var good=[154128,154129,154126,154127];
    var med=[153711,153712,153713,153710];
    var specItem=[153686,153685,153683,153684];
    if(data.bonus.split(",").indexOf("1808")!==-1 || data.bonus.split(",").indexOf("4802")!==-1 || specItem.indexOf(data.id_item*1)!==-1){
        if(!!data.gems){
            var gem=data.gems.split(",")[0];
            if(best.indexOf(gem*1)!==-1){ return 'magenta'; }
            if(good.indexOf(gem*1)!==-1){ return 'green'; }
            if(med.indexOf(gem*1)!==-1){ return 'gray'; }
            return 'black';
        } else { return 'red' }
    } else { return 'white'; }
}
function getQualityEnch(data){
    var good=[5963,5964,5966,5965,5962, 5949,5948,5946,5950, 5944,5942,5945,5943, 3370,3368,3847, 5957,5956,5955];
    var med=[5940,5938,5941,5939];
    
    if([11,91, 13,15,17,21,23].indexOf(data.id_slot*1)!==-1){
        if(!!data.enchant){
            if(good.indexOf(data.enchant*1)!==-1){ return 'green'; }
            if(med.indexOf(data.enchant*1)!==-1){ return 'gray'; }
            return 'black';
        } else { return 'red' }
    } else { return 'white'; }
}