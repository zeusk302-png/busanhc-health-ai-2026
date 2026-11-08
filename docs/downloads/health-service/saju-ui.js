/* Display only. No network, persistent storage, accounts, or medical inference. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const form=$('saju-form');
  if(!form)return;
  const STORIES={
    목:['목 · 새싹을 키우는 이야기','작은 아이디어를 종이에 심어 보는 주인공. 오늘의 창작 미션은 새로운 서비스 이름 세 개 적기!'],
    화:['화 · 장면을 밝히는 이야기','화면에 포인트 하나를 켜 보는 주인공. 오늘의 창작 미션은 가장 중요한 버튼 한 개를 눈에 띄게 만들기!'],
    토:['토 · 중심을 잡는 이야기','정보를 차곡차곡 정리하는 주인공. 오늘의 창작 미션은 설명의 순서를 세 단계로 정리하기!'],
    금:['금 · 디테일을 다듬는 이야기','작은 차이를 살피는 주인공. 오늘의 창작 미션은 입력 오류 한 가지를 찾아 고치기!'],
    수:['수 · 흐름을 잇는 이야기','다음 장면을 상상하는 주인공. 오늘의 창작 미션은 처음 쓰는 친구에게 사용 순서를 설명하기!']
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
      $('story-title').textContent=STORIES[r.dayElement][0];$('story-text').textContent=STORIES[r.dayElement][1]+' (일간 오행에 연결한 수업용 창작 문구)';
      $('result').hidden=false;
    }catch(err){$('error').textContent=err.message;}
  });
  form.addEventListener('input',clear);
  form.addEventListener('reset',clear);
  $('sample-button').addEventListener('click',()=>{clear();$('birth-date').value='2005-12-23';$('birth-time').value='08:37';});
  $('print-button').addEventListener('click',()=>window.print());
})();
