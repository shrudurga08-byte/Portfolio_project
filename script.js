(function(){
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var pad=function(n,l){return String(n).padStart(l,'0')};
  function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function put(k,v){try{localStorage.setItem(k,String(v))}catch(e){}}

  /* World data: map position (percent of the map box), accent color, banner scene */
  var W=[
    {id:'about',   name:'Home Village',   x:22,y:90,  c:'#6BE06A',scene:'village'},
    {id:'quests',  name:'Startup Tower',  x:68,y:78.5,c:'#FF5C8A',scene:'tower'},
    {id:'projects',name:'Code Forest',    x:30,y:67,  c:'#3FE0D0',scene:'forest'},
    {id:'bonus',   name:'Bug Cave',       x:72,y:55.5,c:'#FF8A3D',scene:'cave'},
    {id:'skills',  name:'Skill Forge',    x:28,y:44,  c:'#FFD23F',scene:'forge'},
    {id:'school',  name:'Academy Hill',   x:70,y:32.5,c:'#9B7BFF',scene:'academy'},
    {id:'trophies',name:'Trophy Temple',  x:32,y:21,  c:'#5AA9FF',scene:'temple'},
    {id:'contact', name:'Contact Castle', x:60,y:9.5, c:'#FF4D4D',scene:'castle'}
  ];

  var S={name:'',color:'#FF5C8A',cleared:[],coins:+get('sd-coins')||0,best:+get('sd-best')||0,all:get('sd-all')==='1',cur:0,walking:false,view:'gate'};
  try{S.cleared=JSON.parse(get('sd-cleared')||'[]')}catch(e){S.cleared=[]}
  if(!Array.isArray(S.cleared))S.cleared=[];
  var savedName=get('sd-name')||'';
  var savedColor=get('sd-color');
  if(savedColor&&/^#[0-9A-Fa-f]{6}$/.test(savedColor))S.color=savedColor.toUpperCase();

  function isCleared(i){return S.cleared.indexOf(W[i].id)>-1}
  function unlocked(i){return S.all||i===0||isCleared(i-1)}
  function firstOpen(){for(var i=0;i<W.length;i++)if(!isCleared(i))return i;return W.length-1}

  /* Toast and coin pop */
  var toastEl=$('#toast'),toastT=0;
  function toast(msg){
    toastEl.textContent=msg;toastEl.classList.add('show');
    clearTimeout(toastT);toastT=setTimeout(function(){toastEl.classList.remove('show')},2300);
  }
  function pop(el,text){
    var r=el.getBoundingClientRect(),p=document.createElement('span');
    p.className='pop';p.textContent=text;
    p.style.left=(r.left+r.width/2-14)+'px';p.style.top=(r.top-6)+'px';
    document.body.appendChild(p);setTimeout(function(){p.remove()},850);
  }
  var hudLv=$('#hudLv'),hudCoins=$('#hudCoins'),xpFill=$('#xpFill');
  function renderHud(){
    hudLv.textContent=pad(1+S.cleared.length,2);hudCoins.textContent=pad(S.coins,3);
    xpFill.style.width=(S.cleared.length/W.length*100)+'%';
  }
  function addCoins(n,from){
    S.coins+=n;put('sd-coins',S.coins);renderHud();
    if(from)pop(from,'+'+n);
  }

  /* Pixel character */
  var ROWS=['...hhhhhh...','..hhhhhhhh..','.hhhhhhhhhh.','.hhsssssshh.','.hssesssesh.','.hssssssssh.','.hsssmmsssh.','..hssssssh..','..pppppppp..','.pppppppppp.','ssppppppppss','.spppppppps.','..pppppppp..','..dd....dd..','..bb....bb..'];
  function sprite(c){
    var pal={h:'#9B7BFF',s:'#FFCF9E',e:'#1B1030',m:'#E0557A',p:S.color,d:'#3B4CCA',b:'#FFD23F'};
    var x=c.getContext('2d'),k=c.width/12;
    x.clearRect(0,0,c.width,c.height);
    ROWS.forEach(function(r,y){r.split('').forEach(function(ch,i){if(pal[ch]){x.fillStyle=pal[ch];x.fillRect(i*k,y*k,k,k)}})});
  }
  function drawAvatars(){$$('.avatar').forEach(sprite);if(walkerCv)sprite(walkerCv)}

  /* Helpers for generated pixel art */
  function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  function hx(h){return [parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)]}
  function mix(h,t,a){var c=hx(h),d=hx(t);return 'rgb('+c.map(function(v,i){return Math.round(v+(d[i]-v)*a)}).join(',')+')'}

  /* Overworld terrain: eight zones, one per world */
  function terrain(c){
    var x=c.getContext('2d'),w=c.width,h=c.height,r=rng(7);
    var Z=[.15,.27,.38,.50,.61,.73,.84,1];
    var C=['#5A1A2E','#1F3F78','#3A2E78','#5A3A12','#3A1E1A','#17504A','#2A2058','#1F5A33'];
    for(var py=0;py<h;py++){for(var px=0;px<w;px++){
      var f=py/h+(r()-.5)*.025,z=0;while(z<7&&f>Z[z])z++;
      var col=C[z],q=r();
      if(q<.12)col=mix(col,'#FFFFFF',.10);else if(q<.22)col=mix(col,'#000000',.25);
      x.fillStyle=col;x.fillRect(px,py,1,1);
    }}
    function tree(a,b,col){x.fillStyle=col;x.fillRect(a+1,b,1,1);x.fillRect(a,b+1,3,1);x.fillRect(a-1,b+2,5,1);x.fillStyle='#3A2A1A';x.fillRect(a+1,b+3,1,2)}
    function scatter(n,from,to,fn){for(var i=0;i<n;i++)fn(3+Math.floor(r()*(w-6)),Math.floor((from+r()*(to-from))*h))}
    scatter(12,.86,.98,function(a,b){tree(a,b,'#2E8B4A')});
    scatter(16,.63,.72,function(a,b){tree(a,b,'#1F8F6B')});
    scatter(26,.51,.60,function(a,b){x.fillStyle='#5A3A34';x.fillRect(a,b,2,1)});
    scatter(30,.39,.49,function(a,b){x.fillStyle=r()<.5?'#FF8A3D':'#FFD23F';x.fillRect(a,b,1,1)});
    scatter(24,.29,.37,function(a,b){x.fillStyle=r()<.5?'#E9E0FF':'#FF9BD0';x.fillRect(a,b,1,1)});
    scatter(30,.01,.14,function(a,b){x.fillStyle='#FFE0E0';x.fillRect(a,b,1,1)});
    scatter(14,.75,.83,function(a,b){x.fillStyle='#413380';x.fillRect(a,b-2,3,3);x.fillStyle='#FFD23F';x.fillRect(a+1,b-1,1,1)});
    scatter(18,.16,.26,function(a,b){x.fillStyle='#C9A15A';x.fillRect(a,b,2,1)});
  }

  /* World banners (160x40 pixel scenes) */
  function banner(c,type){
    var x=c.getContext('2d'),R=rng(type.length*13+5),i;
    function px(a,b,w,h,col){x.fillStyle=col;x.fillRect(a,b,w,h)}
    function sky(cols,rows){var hh=Math.ceil(rows/cols.length);cols.forEach(function(cl,k){px(0,k*hh,160,hh,cl)})}
    function tri(a,b,w,h,col){for(var rr=0;rr<h;rr++){var ww=Math.max(1,Math.round(w*(rr+1)/h));px(a+Math.round((w-ww)/2),b+rr,ww,1,col)}}
    function stars(n,col){for(var k=0;k<n;k++)px(Math.floor(R()*160),Math.floor(R()*24),1,1,col)}
    function disc(cx,cy,rad,col){for(var yy=-rad;yy<=rad;yy++){var ww=Math.round(Math.sqrt(rad*rad-yy*yy));px(cx-ww,cy+yy,ww*2+1,1,col)}}
    switch(type){
      case 'village':
        sky(['#2B1B5E','#4B2D86','#7A3C9E','#C25A8F','#FF8F7A'],34);disc(122,24,9,'#FFD23F');disc(122,24,6,'#FFF0A0');
        for(i=0;i<160;i++){var hh=6+Math.round(Math.sin(i/16)*3+Math.sin(i/7));px(i,36-hh,1,hh+4,'#1F6B3A')}
        px(0,36,160,4,'#2E8B4A');
        px(28,24,18,12,'#E8C98A');tri(25,15,24,10,'#C0405A');px(34,29,5,7,'#6B3A22');px(40,27,4,4,'#9BD6FF');
        [70,86,100,142,150].forEach(function(t){px(t+1,30,2,6,'#5A3A1A');tri(t-3,22,10,10,'#1F7A44')});
        break;
      case 'tower':
        sky(['#0E0A2A','#1A1248','#2A1B66','#3A2680'],30);stars(30,'#FFFFFF');disc(132,10,6,'#F4F0FF');
        var xx=0;while(xx<160){var bw=8+Math.floor(R()*8),bh=14+Math.floor(R()*20);px(xx,40-bh,bw,bh,R()<.5?'#1B1240':'#241A58');
          for(var wy=40-bh+2;wy<38;wy+=4)for(var wx=xx+2;wx<xx+bw-2;wx+=3)if(R()<.45)px(wx,wy,1,2,'#FFD23F');xx+=bw+1}
        px(0,38,160,2,'#0B0618');
        break;
      case 'forest':
        sky(['#0A2A3A','#0E3E4E','#13566A','#1B7080'],30);stars(18,'#CFFAF5');disc(30,10,5,'#E6FFFB');
        for(var t=-4;t<165;t+=9){var th=14+Math.floor(R()*12),a=Math.round(th*.45);
          tri(t+1,36-th,10,a,'#0F5A3A');tri(t,36-th+Math.round(a*.6),12,a,'#13734A');px(t+5,34,2,4,'#4A2E1A')}
        px(0,37,160,3,'#0C3A2A');
        break;
      case 'cave':
        sky(['#140A12','#1E0F1A','#2A1420','#331A22'],40);
        for(i=0;i<160;i+=7){var sh=5+Math.floor(R()*14);for(var q=0;q<sh;q++){var ww=Math.max(1,Math.round(5*(sh-q)/sh));px(i+Math.round((5-ww)/2),q,ww,1,'#3D2630')}}
        px(0,36,160,4,'#2A1A22');for(i=0;i<160;i+=11)px(i,34,6,2,'#3D2630');
        for(var e=0;e<9;e++){var ex=4+Math.floor(R()*150),ey=14+Math.floor(R()*18);px(ex-1,ey-1,6,3,'rgba(255,92,138,.28)');px(ex,ey,1,1,'#FFFFFF');px(ex+3,ey,1,1,'#FFFFFF')}
        break;
      case 'forge':
        sky(['#2A0E0A','#3E160E','#5A2210','#7A3412'],30);
        for(i=-10;i<170;i+=26){var mh=14+Math.floor(R()*12);tri(i,38-mh,40,mh,'#2A1410')}
        px(0,34,160,6,'#1A0C08');for(i=0;i<160;i++)if(R()<.35)px(i,34+Math.floor(R()*3),1,1,'#FF8A3D');
        for(i=0;i<40;i++)px(Math.floor(R()*160),Math.floor(R()*34),1,1,R()<.5?'#FFD23F':'#FF8A3D');
        px(70,28,20,3,'#8A8AA8');px(74,31,12,3,'#6A6A88');px(72,34,16,2,'#5A5A78');
        break;
      case 'academy':
        sky(['#3A2E78','#5A48A8','#7E68CC','#A790EC'],30);
        px(20,8,16,3,'#E9E0FF');px(24,6,8,2,'#E9E0FF');px(112,12,20,3,'#E9E0FF');px(116,10,10,2,'#E9E0FF');
        px(0,34,160,6,'#2F7A4A');
        px(56,20,48,14,'#E9DFC8');tri(52,10,56,10,'#C0405A');
        for(i=0;i<6;i++)px(58+i*8,22,3,12,'#FFFFFF');
        px(76,28,8,6,'#5A3A22');px(52,34,56,2,'#CFC4A8');px(79,2,1,9,'#3A2E78');px(80,2,6,4,'#FFD23F');
        break;
      case 'temple':
        sky(['#14204F','#23387F','#3D5FB0','#E88A78','#FFC890'],34);stars(20,'#FFFFFF');disc(128,32,8,'#FFE9A0');
        px(0,34,160,6,'#8A6A3A');
        for(i=0;i<6;i++){var pw=60-i*10;px(80-pw/2,30-i*4,pw,4,i%2?'#B58B48':'#C9A15A')}
        px(79,6,2,4,'#FFD23F');px(46,26,2,8,'#5A3A22');px(46,23,2,3,'#FF8A3D');px(112,26,2,8,'#5A3A22');px(112,23,2,3,'#FF8A3D');
        break;
      case 'castle':
        sky(['#1A0610','#2E0A1C','#4A0E2A','#6A1A36'],30);stars(24,'#FFE0E0');disc(40,12,8,'#FFE9E0');
        var cc='#0E0408';
        px(60,24,40,16,cc);px(46,12,14,28,cc);px(100,12,14,28,cc);px(72,4,16,36,cc);
        [[46,12,14],[100,12,14],[72,4,16],[60,24,40]].forEach(function(t){for(var k=0;k<t[2];k+=4)px(t[0]+k,t[1]-2,2,2,cc)});
        px(52,20,2,3,'#FF5C8A');px(106,20,2,3,'#FF5C8A');px(79,12,2,4,'#FF5C8A');px(79,28,2,4,'#FFD23F');
        px(80,0,1,4,cc);px(81,0,4,2,'#FF4D4D');px(76,32,8,8,'#3A0A1A');px(0,38,160,2,cc);
        break;
    }
  }

  /* Build the map */
  var mapbox=$('#mapbox'),nodes=[],walker,walkerCv,trail;
  function buildMap(){
    var pts=W.map(function(n){return n.x+','+n.y}).join(' ');
    mapbox.innerHTML='<canvas class="terrain" width="96" height="160"></canvas>'+
      '<svg class="mapsvg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+
      '<polyline class="base" points="'+pts+'"/><polyline class="full" points="'+pts+'"/><polyline class="trail" points=""/></svg>';
    terrain($('.terrain',mapbox));
    trail=$('.trail',mapbox);
    W.forEach(function(n,i){
      var b=document.createElement('button');
      b.type='button';b.className='mnode';b.style.left=n.x+'%';b.style.top=n.y+'%';b.style.setProperty('--c',n.c);
      b.innerHTML='<span class="mn-box"></span><span class="mn-name"></span>';
      b.firstChild.textContent=i+1;b.lastChild.textContent=n.name;
      b.addEventListener('click',function(){onNode(i)});
      mapbox.appendChild(b);nodes.push(b);
    });
    walker=document.createElement('div');walker.className='walker';
    walkerCv=document.createElement('canvas');walkerCv.width=48;walkerCv.height=60;
    walker.appendChild(walkerCv);mapbox.appendChild(walker);
  }
  function placeWalker(i){S.cur=i;walker.style.left=W[i].x+'%';walker.style.top=W[i].y+'%';walker.classList.remove('flip')}

  function renderMap(){
    var cn=S.cleared.length;
    $('#clearedN').textContent=cn+'/'+W.length;
    $('#welcome').textContent='WELCOME, '+S.name;
    $('#endMsg').hidden=cn<W.length;
    var mu=0;
    nodes.forEach(function(b,i){
      var done=isCleared(i),open=unlocked(i)&&!done;
      b.classList.toggle('done',done);b.classList.toggle('open',open);b.classList.toggle('locked',!unlocked(i));
      b.setAttribute('aria-label','World '+(i+1)+', '+W[i].name+', '+(done?'cleared':open?'open':'locked'));
      if(unlocked(i))mu=i;
    });
    trail.setAttribute('points',W.slice(0,mu+1).map(function(n){return n.x+','+n.y}).join(' '));
    $('#unlockAll').disabled=S.all;
    renderHud();
  }

  function walk(to,done){
    if(S.walking)return;
    var from=S.cur;
    if(from===to){if(done)done();return}
    S.walking=true;
    var step=to>from?1:-1,i=from;
    (function hop(){
      var prev=W[i];i+=step;var n=W[i];
      walker.classList.toggle('flip',n.x<prev.x);
      walker.style.left=n.x+'%';walker.style.top=n.y+'%';S.cur=i;
      setTimeout(function(){if(i===to){S.walking=false;if(done)done()}else hop()},570);
    })();
  }
  function onNode(i){
    if(S.walking)return;
    if(!unlocked(i)){
      toast('LOCKED · CLEAR WORLD '+i+' FIRST');
      var b=nodes[i];b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');
      return;
    }
    walk(i,function(){setTimeout(function(){openStage(i)},200)});
  }

  /* Views */
  var gate=$('#gate'),mapview=$('#mapview'),stages=$('#stages'),hud=$('#hud'),hudMap=$('#hudMap');
  function show(v){
    S.view=v;
    gate.hidden=v!=='gate';mapview.hidden=v!=='map';stages.hidden=v!=='stage';
    hud.hidden=v==='gate';hudMap.hidden=v!=='stage';
    window.scrollTo(0,0);
  }
  function goMap(){stopGame();renderMap();show('map')}
  var stageEls=W.map(function(n){return document.getElementById('s-'+n.id)});

  function setupStages(){
    stageEls.forEach(function(el,i){
      el.style.setProperty('--c',W[i].c);
      var cvn=document.createElement('canvas');cvn.className='banner';cvn.width=160;cvn.height=40;
      cvn.setAttribute('role','img');cvn.setAttribute('aria-label',W[i].name+' scene');
      el.insertBefore(cvn,el.firstChild);banner(cvn,W[i].scene);
      var nav=document.createElement('div');nav.className='stage-nav';
      nav.innerHTML='<button class="btn alt small" type="button" data-act="map">◀ WORLD MAP</button><button class="btn" type="button" data-act="clear" data-i="'+i+'"></button>';
      $('.wrap',el).appendChild(nav);
    });
  }
  function clearLabel(i){
    return isCleared(i)?'STAGE CLEARED ✓':(i===W.length-1?'CLEAR FINAL STAGE ★':'CLEAR STAGE ★');
  }
  function openStage(i){
    stopGame();
    stageEls.forEach(function(el,k){el.hidden=k!==i});
    $('[data-act="clear"]',stageEls[i]).textContent=clearLabel(i);
    S.cur=i;show('stage');
  }
  function clearStage(i){
    var first=!isCleared(i);
    if(first){S.cleared.push(W[i].id);put('sd-cleared',JSON.stringify(S.cleared));addCoins(5,null)}
    goMap();
    if(first){
      if(S.cleared.length===W.length)toast('ALL WORLDS CLEARED · +5 COINS');
      else toast('STAGE CLEAR · +5 COINS');
      if(i<W.length-1){setTimeout(function(){walk(i+1,function(){toast('WORLD '+(i+2)+' UNLOCKED · '+W[i+1].name.toUpperCase())})},700)}
    }
  }

  /* Click delegation */
  document.addEventListener('click',function(e){
    var t=e.target.closest?e.target.closest('[data-act],.qblock'):null;if(!t)return;
    if(t.classList.contains('qblock')){
      if(t.classList.contains('used'))return;
      t.classList.add('used');t.setAttribute('aria-label','Coin collected');addCoins(1,t);return;
    }
    var act=t.getAttribute('data-act');
    if(act==='map'){if(S.view!=='gate'&&!S.walking)goMap()}
    else if(act==='clear'){clearStage(+t.getAttribute('data-i'))}
  });

  /* Login */
  var form=$('#loginForm'),pname=$('#pname'),msg=$('#loginMsg');
  pname.value=savedName;
  if(savedName)msg.textContent='Welcome back. Press PLAY NOW to continue.';
  function paintSwatches(){$$('.sw').forEach(function(s){s.setAttribute('aria-pressed',s.getAttribute('data-color')===S.color?'true':'false')})}
  paintSwatches();
  $$('.sw').forEach(function(s){s.addEventListener('click',function(){S.color=s.getAttribute('data-color');put('sd-color',S.color);paintSwatches();drawAvatars()})});
  function login(name){
    S.name=name;put('sd-name',name);
    S.cleared=S.cleared.filter(function(id){return W.some(function(w){return w.id===id})});
    placeWalker(firstOpen());
    renderMap();$('#hudName').textContent='P1 · '+name;show('map');
    toast('WELCOME, '+name);
  }
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var v=pname.value.trim().toUpperCase().slice(0,12);
    if(!v){msg.className='msg err';msg.textContent='Type a player name to start, or continue as guest.';pname.focus();return}
    msg.className='msg';login(v);
  });
  $('#guestBtn').addEventListener('click',function(){msg.className='msg';login('GUEST')});
  $('#logout').addEventListener('click',function(){if(S.walking)return;stopGame();msg.className='msg';msg.textContent='';show('gate')});
  $('#unlockAll').addEventListener('click',function(){S.all=true;put('sd-all','1');renderMap();toast('ALL WORLDS UNLOCKED')});
  $('#toTop').addEventListener('click',function(){window.scrollTo(0,0)});

  /* Copy buttons */
  $$('.copy').forEach(function(b){
    b.addEventListener('click',function(){
      var text=b.getAttribute('data-copy'),src=document.getElementById(b.getAttribute('data-from'));
      function fallback(){
        try{var r=document.createRange();r.selectNodeContents(src);var s=getSelection();s.removeAllRanges();s.addRange(r)}catch(e){}
        toast('SELECTED · PRESS CTRL+C');
      }
      try{
        if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){toast('COPIED')},fallback)}
        else fallback();
      }catch(e){fallback()}
    });
  });

  /* Bug Squash */
  var cv=$('#game'),cx=cv.getContext('2d'),GW=cv.width,GH=cv.height;
  var overlay=$('#overlay'),ovTitle=$('#ovTitle'),ovMsg=$('#ovMsg'),startBtn=$('#startBtn');
  var gScore=$('#gScore'),gLives=$('#gLives'),gBest=$('#gBest');
  var BUG=['.b...b.','..b.b..','.bbbbb.','bbebebb','.bbbbb.','b.bbb.b','..b.b..'];
  var bugs=[],splats=[],running=false,score=0,lives=3,last=0,spawnT=0,raf=0,clock=0,earned=0;
  var INTRO='Click or tap each bug before it reaches the deploy line. Three bugs through and the build fails.';
  function gHud(){
    gScore.textContent=pad(score,3);gBest.textContent=pad(S.best,3);
    gLives.textContent=new Array(lives+1).join('■')+new Array(4-lives).join('□');
  }
  function spawn(){bugs.push({x0:30+Math.random()*(GW-60),y:-20,v:55+Math.random()*30+Math.min(score/5,110),ph:Math.random()*6.28,x:0})}
  function startGame(){
    bugs=[];splats=[];score=0;lives=3;spawnT=.3;clock=0;
    running=true;overlay.hidden=true;cv.style.touchAction='none';gHud();
    last=performance.now();raf=requestAnimationFrame(loop);
  }
  function stopGame(){
    if(!running)return;
    running=false;cancelAnimationFrame(raf);cv.style.touchAction='';
    ovTitle.textContent='BUG SQUASH';ovMsg.textContent=INTRO;startBtn.textContent='START';overlay.hidden=false;draw();
  }
  function overGame(){
    running=false;cancelAnimationFrame(raf);cv.style.touchAction='';
    var newBest=score>S.best;if(newBest){S.best=score;put('sd-best',S.best)}
    earned=Math.floor(score/50);if(earned>0)addCoins(earned,startBtn);
    ovTitle.textContent='BUILD FAILED';
    ovMsg.textContent='Score '+score+(newBest&&score>0?'. New best!':'.')+(earned>0?' You earned '+earned+' coin'+(earned>1?'s':'')+'.':' Reach 50 points to earn a coin.');
    startBtn.textContent='PLAY AGAIN';overlay.hidden=false;gHud();draw();
  }
  function loop(now){
    if(!running)return;
    var dt=Math.min(.05,(now-last)/1000);last=now;clock+=dt;spawnT-=dt;
    if(spawnT<=0){spawn();spawnT=Math.max(.35,1.1-score/600)}
    for(var i=bugs.length-1;i>=0;i--){
      var b=bugs[i];b.y+=b.v*dt;b.x=b.x0+Math.sin(clock*2+b.ph)*14;
      if(b.y>GH-26){bugs.splice(i,1);lives--;gHud();if(lives<=0){overGame();return}}
    }
    for(var j=splats.length-1;j>=0;j--){splats[j].t-=dt;if(splats[j].t<=0)splats.splice(j,1)}
    draw();raf=requestAnimationFrame(loop);
  }
  function draw(){
    cx.fillStyle='#120A24';cx.fillRect(0,0,GW,GH);
    cx.strokeStyle='rgba(155,123,255,.12)';cx.lineWidth=1;
    for(var x=0;x<=GW;x+=40){cx.beginPath();cx.moveTo(x+.5,0);cx.lineTo(x+.5,GH);cx.stroke()}
    for(var y=0;y<=GH;y+=40){cx.beginPath();cx.moveTo(0,y+.5);cx.lineTo(GW,y+.5);cx.stroke()}
    cx.fillStyle='#FFD23F';for(var d=0;d<GW;d+=24)cx.fillRect(d,GH-26,12,4);
    cx.font='10px "Press Start 2P",monospace';cx.fillStyle='#B8ADE0';cx.fillText('DEPLOY ZONE',12,GH-8);
    var k=5;
    bugs.forEach(function(b){
      var ox=Math.round(b.x-17),oy=Math.round(b.y-17);
      BUG.forEach(function(r,ry){r.split('').forEach(function(ch,rx){
        if(ch==='.')return;
        cx.fillStyle=ch==='e'?'#FFFFFF':'#FF5C8A';cx.fillRect(ox+rx*k,oy+ry*k,k,k);
      })});
    });
    splats.forEach(function(s){var g=(.3-s.t)*120+6;cx.fillStyle='#3FE0D0';cx.fillRect(s.x-g,s.y-3,g*2,6);cx.fillRect(s.x-3,s.y-g,6,g*2)});
  }
  cv.addEventListener('pointerdown',function(e){
    if(!running)return;
    var r=cv.getBoundingClientRect(),px=(e.clientX-r.left)*(GW/r.width),py=(e.clientY-r.top)*(GH/r.height);
    for(var i=bugs.length-1;i>=0;i--){
      var dx=bugs[i].x-px,dy=bugs[i].y-py;
      if(dx*dx+dy*dy<32*32){splats.push({x:bugs[i].x,y:bugs[i].y,t:.3});bugs.splice(i,1);score+=10;gHud();break}
    }
  });
  startBtn.addEventListener('click',startGame);

  /* Init */
  buildMap();setupStages();drawAvatars();renderHud();gHud();draw();
  show('gate');
})();