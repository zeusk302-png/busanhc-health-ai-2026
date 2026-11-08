/* Display only. No network, persistent storage, accounts, or medical inference. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const form=$('saju-form');
  if(!form)return;
  const STORIES={
    목:['일간 오행: 목(木)','천간 甲(갑)·乙(을)은 목으로 분류합니다.'],
    화:['일간 오행: 화(火)','천간 丙(병)·丁(정)은 화로 분류합니다.'],
    토:['일간 오행: 토(土)','천간 戊(무)·己(기)는 토로 분류합니다.'],
    금:['일간 오행: 금(金)','천간 庚(경)·辛(신)은 금으로 분류합니다.'],
    수:['일간 오행: 수(水)','천간 壬(임)·癸(계)는 수로 분류합니다.']
  };
  function clear(){ $('result').hidden=true; $('error').textContent=''; }
  form.addEventListener('submit',function(e){
    e.preventDefault();clear();
    try{
      if(!globalThis.Saju)throw Error('계산 파일을 찾지 못했어요. 압축을 푼 폴더에 index.html, saju-core.js, saju-ui.js가 함께 있는지 확인해 주세요.');
      const r=Saju.calculate($('birth-date').value,$('birth-time').value);
      $('result-date').textContent=`${r.date} ${r.time} · KST`;
      $('pillars').replaceChildren(...r.pillars.map(p=>{const box=document.createElement('div');box.className='pillar';const label=document.createElement('small');label.textContent=p.label;const hanja=document.createElement('b');hanja.className='hanja';hanja.textContent=p.hanja;const korean=document.createElement('span');korean.textContent=p.korean;box.append(label,hanja,korean);return box;}));
      $('elements').replaceChildren(...Object.entries(r.counts).map(([name,n])=>{const box=document.createElement('div');box.className='element';box.textContent=name;const count=document.createElement('b');count.textContent=n+'개';box.append(count);return box;}));
      $('story-title').textContent=STORIES[r.dayElement][0];$('story-text').textContent=STORIES[r.dayElement][1];
      $('result').hidden=false;
    }catch(err){$('error').textContent=err.message;}
  });
  form.addEventListener('input',clear);
  form.addEventListener('reset',clear);
  $('sample-button').addEventListener('click',()=>{clear();$('birth-date').value='2005-12-23';$('birth-time').value='08:37';});
  $('print-button').addEventListener('click',()=>window.print());
})();
