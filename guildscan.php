<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

set_time_limit (600);

$realm="азурегос";
$character="";
$guild="Зов+КТуна";
$disable_rank=7;
function request(){
    global $realm,$guild,$disable_rank;
    $text=file_get_contents('https://www.wowprogress.com/guild/eu/'.$realm.'/'.$guild.'?roster');
    
    $b=strpos($text,'<table id="char_list_table" class="rating"><tbody>');
    $text=substr($text,$b+50,strlen($text)-50-28);
    $ansAr=[];
    foreach (explode('</tr>',$text) as $key=>$value){
        //echo htmlspecialchars($value);
        //if($key>3) break;
        preg_match_all('|<tr class="(.+)"><td.+><span>(\d)</span></td><td.+><a.+>(.+)</a>.*</td><td.+>.+</td><td.+>(.+)</td><td.+><span>(.+)</span></td><td.+>.*</td><td.+>.*</td>|im'
            ,str_replace(".",",",$value), $matches, PREG_SET_ORDER);
        $ilvl=$matches[0][4];//str_replace(",",".",$matches[0][4]);
        if($matches[0][1]!="" && $matches[0][2]*1<$disable_rank){
            $status=getGameStatus($matches[0][3]);
            $ansAr[]=[$matches[0][3],$matches[0][2],getClassName($matches[0][1]),getTypeArmor($matches[0][1]),$status[0],$ilvl,$matches[0][5],$status[0]=="запас"?$status[1]:"&nbsp;"];
        }
    }
    $ans="";
    foreach ($ansAr as $value){
        $ans.='</tr><td>'.implode($value,'</td><td>').'</td></tr>';
    }
    return '<table border=1>'.$ans.'</table>';
}
function getTypeArmor($class){
    if(in_array($class,['paladin','deathknight','warrior'])) {return "латы";}
    else if(in_array($class,['shaman','hunter'])) {return "кольчуга";}
    else if(in_array($class,['monk','demon_hunter','druid','rogue'])) {return "кожа";}
    else if(in_array($class,['mage','priest','warlock'])) {return "ткань";}
    else {return "NA";}
}
function getClassName($class){
    if($class=="paladin") {return "паладин";}
    else if($class=="deathknight") {return "рыцарь смерти";}
    else if($class=="warrior") {return "воин";}
    else if($class=="shaman") {return "шаман";}
    else if($class=="hunter") {return "охотник";}
    else if($class=="monk") {return "монах";}
    else if($class=="demon_hunter") {return "охотник на демонов";}
    else if($class=="druid") {return "друид";}
    else if($class=="rogue") {return "разбойник";}
    else if($class=="mage") {return "маг";}
    else if($class=="priest") {return "жрец";}
    else if($class=="warlock") {return "чернокнижник";}
    else {return "NA";}
}
function getGameStatus($name){
    
    //return ["в игре",""];
    
    global $realm;
    $text=file_get_contents('https://www.wowprogress.com/character/eu/'.$realm.'/'.$name);
    
    $b=strpos($text,'<div class="featured"><dl><dt>Last logout (Armory):');
    $e=strpos($text,'<div class="featured"><form method="post" id="update_character_form"');
    $text=substr($text,$b,$e-$b);
    //echo htmlspecialchars($text);
    preg_match_all('|<div class="featured"><dl><dt>.+</dt><dd><span.+>(.+)</span></dd></dl><dl><dt>.+</dt><dd><span.+>.+</span></dd></dl></div>|im'
            ,$text, $matches, PREG_SET_ORDER);
    
    $ans="NA";
    if(strpos($matches[0][1],'hour')!==false){$ans="в игре";}
    else if(strpos($matches[0][1],'second')!==false){$ans="в игре";}
    else if(strpos($matches[0][1],'minute')!==false){$ans="в игре";}
    else if(strpos($matches[0][1],'day')!==false){
        $temp=explode("days",$matches[0][1]);
        if(trim($temp[0])*1>3){$ans="запас";}
        else {$ans="в игре";}
    }
    else if(strpos($matches[0][1],'month')!==false){$ans="запас";}
    else if(strpos($matches[0][1],'year')!==false){$ans="запас";}
    return [$ans,$matches[0][1]];
}
function view(){
    echo '<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>guildscan</title>
</head>
<body>
'.request().'
</body>
</html>';
}
view();
?>