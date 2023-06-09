<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

set_time_limit (600);

require('oauth_bnet/Client.php');
require('oauth_bnet/GrantType/IGrantType.php');
require('oauth_bnet/GrantType/AuthorizationCode.php');

require_once('connDB.php');

$client_id              = 'xxx';
$client_secret		= 'xxx';
$region			= 'EU';
$locale			= 'en_GB';
$redirect_uri		= 'https://dev.battle.net/';

$client=new OAuth2\Client($client_id, $client_secret, $region, $locale, $redirect_uri);

function auth(){
    global $client;

    if(!isset($_GET['code'])){
        $auth_url=$client->getAuthenticationUrl($client->baseurl[$client->region]['AUTHORIZATION_ENDPOINT'], $client->redirect_uri);
        header('Location: '.$auth_url);
    } else {
        $params = array('code' => $_GET['code'], 'auth_flow' => 'auth_code', 'redirect_uri' => $client->redirect_uri);
        $response = $client->getAccessToken($client->baseurl[$client->region]['TOKEN_ENDPOINT'], 'authorization_code', $params);

        putToken($response['result']['access_token']);

        $client->setAccessToken($response['result']['access_token']);
        $response = $client->fetch('user',array('source'=>'account'));
    }
}
function putToken($token){
    $filename="xtokenxx";
    $handle=fopen($filename,"w");
    $contents=fwrite($handle,$token);
    fclose($handle);
}
function getToken($flag=false){
    $filename="xtokenxx";
    $handle=fopen($filename,"r");
    $contents=fread($handle,filesize($filename));
    fclose($handle);
    if($flag) echo strlen($contents);
    return $contents;
}
function getAccountInfo(){
    global $client;
    $ans=$client->myExReq("https://eu.api.battle.net/account/user?access_token=".getToken());
    echo json_encode($ans);
}
function getWOWProfile(){
    global $client;
    $ans=$client->myExReq("https://eu.api.battle.net/wow/user/characters?access_token=".getToken());
    echo json_encode($ans);
}

function getGuildRoster($realm,$gname,$minRank){
    global $linkdb;
    
    $query="CALL get_guild_roster('".$realm."','".urldecode($gname)."',".$minRank.")";
    $ans=[];
    
    if(mysqli_multi_query($linkdb,$query)){
        if($res=mysqli_store_result($linkdb)){
            if(mysqli_num_rows($res)>0){
                while($row=mysqli_fetch_array($res,MYSQLI_ASSOC)){ $ans[]=$row; }
            }
            mysqli_free_result($res);
        }
        while(mysqli_more_results($linkdb) && mysqli_next_result($linkdb)){ ; }
    }
    
    if(count($ans)>0){
        foreach($ans as $key=>$value){
            $ans[$key]['check']=checkChar($value['id_char']);
        }
        echo json_encode($ans);
    } else { echo "no"; }
}
function getRaidInfo($name,$realm){
    global $client,$client_id;
    $ans=$client->myExReq("https://eu.api.battle.net/wow/character/".$realm."/".$name."?fields=progression&locale=ru_RU&apikey=".$client_id);
    if(array_key_exists("name",$ans)){ if(mb_strtolower($ans['name'])==mb_strtolower(urldecode($name))){ echo json_encode($ans); return true; } }
    echo 'no';
}
function getCharInfo($name,$realm){
    global $linkdb;
    
    $query="select icon_char,id_char,avg_ilvl from characters where name_char='".$name."' and name_realm='".$realm."'";
    $res=mysqli_query($linkdb,$query);
    if(mysqli_num_rows($res)>0){
        $row=mysqli_fetch_array($res);
        $icon_char=$row['icon_char'];
        $id_char=$row['id_char'];
        $avg_ilvl=$row['avg_ilvl'];
        
        $query="SELECT
ci.id_slot,
s.name_slot,
ci.id_item,
ci.name_item,
ci.icon_item,
ci.quality,
ci.ilvl,
ci.gems,
ci.enchant,
ci.bonus,
ci.set_pcs
FROM char_items ci
LEFT OUTER JOIN slots s ON s.id_slot=ci.id_slot
WHERE ci.id_char=".$id_char."
ORDER BY s.order_slot";
        $res=mysqli_query($linkdb,$query);
        if(mysqli_num_rows($res)>0){
            $ans=[];
            while($row=mysqli_fetch_array($res,MYSQLI_ASSOC)){ $ans[]=$row; }
            echo json_encode(['data'=>$ans,'icon_char'=>$icon_char,'avg_ilvl'=>$avg_ilvl]);
        } else { echo "no"; }
    } else { echo "no"; }
}
function getCharacterGuild($name,$realm){
    global $client,$client_id;
    $ans=$client->myExReq("https://eu.api.battle.net/wow/character/".$realm."/".$name."?fields=guild&locale=ru_RU&apikey=".$client_id);
    $guildName='';
    if(isset($ans['guild']['name'])) { $guildName=$ans['guild']['name']; }
    return $guildName;
}
function getCharLootHistory($name,$realm){
    global $linkdb;
    
    $query="SELECT
lh.id_item,
lh.name_item,
DATE_FORMAT(lh.date_loot,'%d.%m.%Y %H:%i:%s') date_loot,
lh.bonus,
lh.response,
lh.gear1,
lh.gear2,
IFNULL(lh.sub_type,'') sub_type,
IFNULL(lh.equip_loc,'') equip_loc
FROM loot_history lh WHERE lh.id_char=(SELECT c.id_char FROM characters c WHERE c.name_char='".$name."' AND c.name_realm='".$realm."')
ORDER BY lh.date_loot DESC";
    $res=mysqli_query($linkdb,$query);
    if(mysqli_num_rows($res)>0){
        $ans='<br><div style="text-align: center;"><div style="display: inline-block;"><table id="loot_his_table" border=1>
<tr style="font-weight: bold;"><td>Дата</td><td>Предмет</td><td>Нужность</td><td>Слот</td></tr>';
        while($row=mysqli_fetch_array($res)){
            $ans.='<tr>
<td>'.$row['date_loot'].'</td>
<td width="170px"><a href="http://ru.wowhead.com/item='.$row['id_item'].'&bonus='.str_replace(",",":",$row['bonus']).'" rel="bonus='.str_replace(",",":",$row['bonus']).'" target="_blank">'.$row['name_item'].'</a></td>
<td>'.$row['response'].'</td>
<td>'.($row['equip_loc']!=""?$row['equip_loc']:$row['sub_type']).'</td>
</tr>';
        }
        $ans.="</table></div></div>";
        echo $ans;
    } else { echo ""; }
}

function preSyncGuild($realm,$gname){
    global $linkdb,$client,$client_id;
    
    $ans=$client->myExReq("https://eu.api.battle.net/wow/guild/".$realm."/".$gname."?locale=ru_RU&apikey=".$client_id);
    if(array_key_exists("name",$ans)){ if(mb_strtolower($ans['name'])==mb_strtolower(urldecode($gname))){ echo 'yes'; return true; } }
    echo 'no';
}
function syncGuild($realm,$gname){
    global $linkdb,$client,$client_id;
    
    $res=mysqli_query($linkdb,"UPDATE characters SET name_guild=NULL where LOWER(name_guild)='".mb_strtolower(urldecode($gname))."' and name_realm='".$realm."'");
    
    $ans=$client->myExReq("https://eu.api.battle.net/wow/guild/".$realm."/".$gname."?fields=members&locale=ru_RU&apikey=".$client_id);
    
    $gnameGM=urldecode($gname);
    
    foreach($ans['members'] as $value){
        $member=$value['character'];
        if($value['rank']==0){ $gnameGM=$member['guild']; }
        if($member['level']>=120){ syncCharacter($member['name'],$member['realm'],"'".urldecode($gname)."'",$value['rank']); }
    }
    $res=mysqli_query($linkdb,"UPDATE characters SET name_guild='".$gnameGM."' where name_guild='".urldecode($gname)."' and name_realm='".$realm."'");
}
function searchNewbie($realm,$gname){
    global $linkdb,$client,$client_id;
    
    $query="SELECT name_char FROM characters WHERE LOWER(name_realm)=LOWER('".$realm."') and LOWER(name_guild)=LOWER('".urldecode($gname)."') and guild_rank is not null";
    $res=mysqli_query($linkdb,$query);
    $arChar=[];
    if(mysqli_num_rows($res)>0){
        while($row=mysqli_fetch_array($res,MYSQLI_ASSOC)){ $arChar[]=$row['name_char']; }
    }

    $ans=$client->myExReq("https://eu.api.battle.net/wow/guild/".$realm."/".$gname."?fields=members&locale=ru_RU&apikey=".$client_id);
    
    foreach($ans['members'] as $value){
        $member=$value['character'];
        if($member['level']>=120){
            if(!in_array($member['name'],$arChar)){
                syncCharacter($member['name'],$member['realm'],"'".$member['guild']."'",$value['rank']);
            }
        }
    }
}
function syncCharacter($name,$realm,$name_guild="NULL",$guild_rank="NULL"){
    global $linkdb,$client,$client_id;
    $ans=$client->myExReq("https://eu.api.battle.net/wow/character/".$realm."/".$name."?fields=items&locale=ru_RU&apikey=".$client_id);
    $id_class=$ans['class'];
    $id_race=$ans['race'];
    $id_gender=$ans['gender'];
    $level_char=$ans['level'];
    $icon_char=$ans['thumbnail'];
    $avg_ilvl=$ans['items']['averageItemLevelEquipped'];
    $lastModified=$ans['lastModified']/1000;
    $id_faction=$ans['faction'];
    $guild_rank_upd=",guild_rank=".$guild_rank."";
    if($guild_rank==-1){
        $guild_rank="NULL";
        $guild_rank_upd="";
    }
    
    $res=mysqli_query($linkdb,"INSERT INTO characters (name_char,name_realm,name_guild,id_class,id_race,id_gender,level_char,icon_char,avg_ilvl,date_update,lastModified,id_faction,guild_rank)
VALUES ('".$name."','".$realm."',".$name_guild.",".$id_class.",".$id_race.",".$id_gender.",".$level_char.",'".$icon_char."',".$avg_ilvl.",NOW(),FROM_UNIXTIME(".$lastModified."),".$id_faction.",".$guild_rank.")
ON DUPLICATE KEY UPDATE
name_guild=".$name_guild.",
id_class=".$id_class.",
id_race=".$id_race.",
id_gender=".$id_gender.",
level_char=".$level_char.",
icon_char='".$icon_char."',
avg_ilvl=".$avg_ilvl.",date_update=NOW(),lastModified=FROM_UNIXTIME(".$lastModified."),id_faction=".$id_faction.$guild_rank_upd);
    
    $res=mysqli_query($linkdb,"select id_char from characters where name_char='".$name."' and name_realm='".$realm."'");
    $id_char=mysqli_fetch_array($res)['id_char'];
    syncCharItems($id_char,$ans['items']);
}
function syncCharItems($id_char,$items){
    global $linkdb;
    $arSlot=[];
    $res=mysqli_query($linkdb,"SELECT id_slot,name_json FROM slots WHERE name_json IS NOT null");
    if(mysqli_num_rows($res)>0){
        while($row=mysqli_fetch_array($res)){
            $arSlot[]=array($row['id_slot'],$row['name_json']);
        }
    }
    if(count($arSlot)>0){
        foreach ($arSlot as $value){
            if(array_key_exists($value[1],$items)){
                $item=$items[$value[1]];
                
                $item_name=str_replace("'","''",$item['name']);
                
                $gems=[];
                if(array_key_exists("gem0",$item['tooltipParams'])){ $gems[]=$item['tooltipParams']['gem0']; }
                if(array_key_exists("gem1",$item['tooltipParams'])){ $gems[]=$item['tooltipParams']['gem1']; }
                if(array_key_exists("gem2",$item['tooltipParams'])){ $gems[]=$item['tooltipParams']['gem2']; }
                if(count($gems)>0){ $gems=implode(",",$gems); }
                else $gems="";
                
                $enchant="";
                if(array_key_exists("enchant",$item['tooltipParams'])){ $enchant=$item['tooltipParams']['enchant']; }
                
                $bonus="";
                if(array_key_exists("bonusLists",$item)){ if(count($item['bonusLists'])>0){ $bonus=implode(",",$item['bonusLists']); } }
                
                $set_pcs="";
                if(array_key_exists("set",$item['tooltipParams'])){ if(count($item['tooltipParams']['set'])>0){ $set_pcs=implode(",",$item['tooltipParams']['set']); } }
                
                $relics="";
                if(array_key_exists("relics",$item)){ if(count($item['relics'])>0){ $relics=json_encode($item['relics']); } }
                
                $slot=$value[0];
                if($value[0]==22){
                    if(array_key_exists("weaponInfo",$item)){ $slot=23; }
                    else if(array_key_exists("armor",$item)){
                        if($item['armor']>0){ $slot=14; }
                    }
                }

                $query="INSERT INTO char_items (
id_char,id_slot,id_item,name_item,icon_item,
quality,ilvl,gems,enchant,bonus,set_pcs,relics,date_update)
VALUES (
".$id_char.",".$slot.",".$item['id'].",'".$item_name."','".$item['icon']."',
".$item['quality'].",".$item['itemLevel'].",'".$gems."','".$enchant."','".$bonus."','".$set_pcs."','".$relics."',NOW())
ON DUPLICATE KEY UPDATE
id_item=".$item['id'].",name_item='".$item_name."',icon_item='".$item['icon']."',
quality=".$item['quality'].",ilvl=".$item['itemLevel'].",gems='".$gems."',enchant='".$enchant."',
bonus='".$bonus."',set_pcs='".$set_pcs."',relics='".$relics."',date_update=NOW()";
                $res=mysqli_query($linkdb,$query);
            } else {
                $res=mysqli_query($linkdb,"delete from char_items WHERE id_char=".$id_char." and id_slot=".$value[0]."");
            }
        }
        $res=mysqli_query($linkdb,"update characters set avg_ilvl=(SELECT ROUND(AVG(ilvl),2) FROM char_items ci WHERE ci.id_char=".$id_char.") where id_char=".$id_char."");
    }
}

function preSyncChar($realm,$name){
    global $linkdb,$client,$client_id;
    
    $ans=$client->myExReq("https://eu.api.battle.net/wow/character/".$realm."/".$name."?fields=guild&locale=ru_RU&apikey=".$client_id);
    if(array_key_exists('name',$ans)){
        if(mb_strtolower($ans['name'])==mb_strtolower(urldecode($name))){
            if(array_key_exists("guild",$ans)){
                $name_guild=$ans['guild']['name'];
                syncCharacter($ans['name'],$realm,"'".$name_guild."'",-1);
            } else {
                syncCharacter($ans['name'],$realm);
            }
            getCharInfo($ans['name'],$realm);
        } else { echo 'no'; }
    } else { echo 'no'; }
}
function updateCharacter($id_char,$id_role,$id_alt_role,$date_invite){
    global $linkdb;
    mysqli_query($linkdb,"UPDATE characters set id_role=".($id_role*1).",id_alt_role=".($id_alt_role*1).",date_invite=STR_TO_DATE('".$date_invite."','%d.%m.%Y') WHERE id_char=".$id_char);
    echo 1;
}
function updateInviteRaid($id_char,$invite_raid){
    global $linkdb;
    mysqli_query($linkdb,"UPDATE characters set invite_raid=".($invite_raid*1)." WHERE id_char=".$id_char);
    echo 1;
}

function checkChar($id_char){
    $ench=checkEnchant($id_char);
    $gems=checkGems($id_char);
    if($ench==-1 || $gems==-1){
        return -1;
    } else if($ench==0 || $gems==0){
        return 0;
    } else {
        return 1;
    }
}
function checkEnchant($id_char){
    global $linkdb;
    
    $good=[5963,5964,5966,5965,5962, 5949,5948,5946,5950, 5944,5942,5945,5943, 3370,3368,3847, 5957,5956,5955];
    $med=[5940,5938,5941,5939];
    
    $query="SELECT ci.enchant,(SELECT COUNT(*) cnt FROM char_items WHERE id_slot NOT IN (14,22) and id_char=".$id_char.") cnt FROM char_items ci
WHERE ci.id_char=".$id_char." AND ci.id_slot IN (11,91, 13,15,17,21,23) AND ci.enchant!=''";
    $res=mysqli_query($linkdb,$query);
    $arEnch=[];
    $flagGood=true;
    $flagMed=false;
    $flagLow=false;
    $maxItemForEnch=3;
    if(mysqli_num_rows($res)>0){
        while($row=mysqli_fetch_array($res)){
            $arEnch[]=$row['enchant'];
            if($row['cnt']>15){ $maxItemForEnch=4; }
            if(!in_array($row['enchant'],$good)){
                $flagMed=true;
                if(!in_array($row['enchant'],$med)){
                    $flagLow=true;
                }
            }
        }
        if(count($arEnch)<$maxItemForEnch || $flagLow){
            return -1;
        } else if($flagMed){
            return 0;
        } else {
            return 1;
        }
    } else { return -1; }
}
function checkGems($id_char){
    global $linkdb;
    
    $best=[153709,153708,153707];
    $good=[154128,154129,154126,154127];
    $med=[153711,153712,153713,153710];
    
    $query="SELECT ci.gems FROM char_items ci WHERE ci.id_char=".$id_char." AND ((ci.bonus LIKE '%1808%' OR ci.bonus LIKE '%4802%') or id_item in (153686,153685,153683,153684))";
    $res=mysqli_query($linkdb,$query);
    $arGems=[];
    $flagGood=true;
    $flagMed=false;
    $flagLow=false;
    $availSoket=mysqli_num_rows($res);
    if($availSoket>0){
        while($row=mysqli_fetch_array($res)){
            if($row['gems']==""){
                return -1;
            } else {
                $arGems[]=$row['gems'];
                if(!in_array($row['gems'],$best) && !in_array($row['gems'],$good)){
                    $flagMed=true;
                    if(!in_array($row['gems'],$med)){
                        $flagLow=true;
                    }
                }
            }
        }
        if($flagLow){
            return -1;
        } else if($flagMed){
            return 0;
        } else {
            return 1;
        }
    } else { return 9; }
}

function updateAttendance($realm,$gname,$id_guild,$id_team){
    global $linkdb,$client,$client_id;
    
    $query="SELECT name_char,id_char FROM characters WHERE name_realm='".$realm."' and LOWER(name_guild)='".mb_strtolower(urldecode($gname))."'";
    $res=mysqli_query($linkdb,$query);
    $arChar=[];
    if(mysqli_num_rows($res)>0){
        while($row=mysqli_fetch_array($res,MYSQLI_ASSOC)){ $arChar[]=$row; }
    } else { exit("no1"); }
    
    $res=mysqli_query($linkdb,"update attendance set attendance=0 where id_char in (SELECT id_char FROM characters WHERE name_realm='".$realm."' and LOWER(name_guild)='".mb_strtolower(urldecode($gname))."')");
    
    $text=file_get_contents("https://www.warcraftlogs.com/guild/attendance-table/".$id_guild."/".$id_team."/0?page=1");
    
    $doc=new DOMDocument();
    $doc->loadHTML($text);    
    $selector=new DOMXPath($doc);
    $result=$selector->query('.//table[@id="attendance-table"]/tbody/tr');
    if($result->length>0){
        $count_comp=0;
        for($i=0;$i<$result->length;$i++){
            $node=$result->item($i);
            $name=trim(mb_convert_encoding($node->childNodes->item(0)->nodeValue, "Windows-1252", "UTF-8"));
            $attendance=str_replace("%","",$node->childNodes->item(1)->nodeValue);
            foreach($arChar as $value){
                if($value['name_char']==$name){
                    $count_comp++;
                    $res=mysqli_query($linkdb,"INSERT INTO attendance (id_char,attendance,date_update)
VALUES (".$value['id_char'].",".$attendance.",NOW())
ON DUPLICATE KEY UPDATE
attendance=".$attendance.",date_update=NOW()");
                }
            }
        }
        if($count_comp>0){ echo "yes"; }
        else { echo "no3"; }
        
    } else {
        echo "no2";
    }
}

function scanEvents($parseStr,$gname,$realm,$date){
    global $linkdb;
    $arPair=explode("#",$parseStr);
    if(count($arPair)>1){
        mysqli_query($linkdb,"delete from events");
        foreach($arPair as $key => $value){
            $arEl=explode("$",$value);
            if(count($arEl)==2){
                $res=mysqli_query($linkdb,"select id_char from characters where name_char='".$arEl[0]."' and name_realm='".$realm."'");
                $id_char=mysqli_fetch_array($res)['id_char'];
                $status=3;
                if($arEl[1]=="подтверждено" || $arEl[1]=="принято"){ $status=1; }
                else if($arEl[1]=="под_вопросом"){ $status=2; }
                mysqli_query($linkdb,"INSERT INTO events (id_char,date_event,status)
                    VALUES (".$id_char.",str_to_date('".$date." 23:59:59','%d.%m.%Y %H:%i:%s'),".$status.")
                    ON DUPLICATE KEY UPDATE
                    date_update=NOW(),date_event=str_to_date('".$date." 23:59:59','%d.%m.%Y %H:%i:%s'), status=".$status);
            }
        }
    } else {
        echo 0;
    }
}

function loadLootHistory($text){
    global $linkdb;
    
    $text=str_replace("'","''",$text);
    $text=str_replace(["[","]"],"",$text);
    if($arLoot=str_getcsv($text)){
        if($maxIndElInLines=array_search(" note",$arLoot)){
            $maxIndElInLines=$maxIndElInLines+1;
            if(count($arLoot)>$maxIndElInLines+1){
                for($i=0;$i<count($arLoot)/$maxIndElInLines;$i++){
                    $name=$arLoot[0+$i*$maxIndElInLines];
                    if($name!="player" && $name!=""){
                        $name=explode("-",$name);
                        $name_char=$name[0];
                        $name_realm=$name[1];
                        $date=$arLoot[1+$i*$maxIndElInLines]." ".$arLoot[2+$i*$maxIndElInLines];
                        $name_item=$arLoot[3+$i*$maxIndElInLines];
                        $id_item=$arLoot[4+$i*$maxIndElInLines];
                        $bonusAr=explode(":",$arLoot[5+$i*$maxIndElInLines]);
                        $bonus=[];
                        if(array_key_exists(14,$bonusAr)){ $bonus[]=$bonusAr[14]; }
                        if(array_key_exists(15,$bonusAr)){ $bonus[]=$bonusAr[15]; }
                        if(array_key_exists(16,$bonusAr)){ $bonus[]=$bonusAr[16]; }
                        if(array_key_exists(17,$bonusAr)){ $bonus[]=$bonusAr[17]; }
                        if(array_key_exists(18,$bonusAr)){ $bonus[]=$bonusAr[18]; }
                        $response=$arLoot[6+$i*$maxIndElInLines];
                        $gear1=$arLoot[11+$i*$maxIndElInLines];
                        $gear2=$arLoot[12+$i*$maxIndElInLines];
                        $sub_type=$arLoot[16+$i*$maxIndElInLines];
                        $equip_loc=$arLoot[17+$i*$maxIndElInLines];

                        $id_char=0;
                        $res=mysqli_query($linkdb,"select id_char from characters where LOWER(name_char)='".mb_strtolower($name_char)."' and LOWER(name_realm)='".mb_strtolower($name_realm)."'");
                        if(mysqli_num_rows($res)>0){
                            $id_char=mysqli_fetch_array($res)['id_char'];
                            $query="INSERT INTO loot_history (
        id_char,id_item,name_item,date_loot,bonus,response,gear1,gear2,date_update,sub_type,equip_loc)
        VALUES (".$id_char.",".$id_item.",'".$name_item."',STR_TO_DATE('".$date."','%d/%m/%Y %H:%i:%s'),'".implode(",",$bonus)."','".$response."','".$gear1."','".$gear2."',NOW(),'".$sub_type."','".$equip_loc."')
        ON DUPLICATE KEY UPDATE
        name_item='".$name_item."',bonus='".implode(",",$bonus)."',
        response='".$response."',gear1='".$gear1."',gear2='".$gear2."',date_update=NOW(),sub_type='".$sub_type."',equip_loc='".$equip_loc."'";
                            $res=mysqli_query($linkdb,$query);
                        }
                    }
                }
                echo "yes";
            } else { echo "no1"; }
        } else { echo "no2"; }
    } else { echo "no3"; }
}

if(isset($_POST['codex'])){
    switch($_POST['codex']){
        case 'putToken': putToken(); break;
        case 'getToken': getToken(true); break;
        case 'getAccountInfo': getAccountInfo(); break;
        case 'getWOWProfile': getWOWProfile(); break;
        
        case 'getCharInfo': getCharInfo($_POST['name'],$_POST['realm']); break;
        case 'getRaidInfo': getRaidInfo($_POST['name'],$_POST['realm']); break;
        case 'getGuildRoster': getGuildRoster($_POST['realm'],$_POST['gname'],$_POST['minRank']); break;
        case 'getCharLootHistory': getCharLootHistory($_POST['name'],$_POST['realm']); break;
        
        case 'preSyncGuild': preSyncGuild($_POST['realm'],$_POST['gname']); break;
        case 'syncGuild': syncGuild($_POST['realm'],$_POST['gname']); break;
        case 'searchNewbie': searchNewbie($_POST['realm'],$_POST['gname']); break;
        
        case 'preSyncChar': preSyncChar($_POST['realm'],$_POST['name']); break;
        case 'updateCharacter': updateCharacter($_POST['id_char'],$_POST['id_role'],$_POST['id_alt_role'],$_POST['date_invite']); break;
        case 'updateInviteRaid': updateInviteRaid($_POST['id_char'],$_POST['invite_raid']); break;
        
        case 'updateAttendance': updateAttendance($_POST['realm'],$_POST['gname'],$_POST['id_guild'],$_POST['id_group']); break;
        
        case 'scanEvents': scanEvents($_POST['parseStr'],$_POST['gname'],$_POST['realm'],$_POST['date']); break;
        
        case 'loadLootHistory': loadLootHistory($_POST['text']); break;
        default: break;
    }
}
?>