(function(){
  'use strict';
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const KEY='busanhc-health-service-v1', CHECKS=['medical','care','materials','build','test','finish'];
  const FIELDS=['projectName','theme','before','after','reflection','factNote'];
  const CASES=[['2005-12-23','08:37'],['2008-05-20','14:30'],['2010-09-10','23:30']];
  const ANSWERS={source:['check','확인한 식약처 식품 코드의 우유 자료는 100g당 칼슘 118mg입니다. 식품과 기준량이 같은지 원문에서 확인합니다.'],privacy:['fiction','원문은 100g 기준입니다. 컵의 크기와 담긴 양이 정해지지 않으면 한 컵의 함량으로 바꿔 쓸 수 없습니다.'],certainty:['original','카드는 무작위 놀이이며 필요한 영양소와 섭취량을 판정하지 않습니다. 음식의 실제 영양정보는 식품·중량·출처로 확인합니다.']};
  let state={fields:{},checks:{},votes:{}},timer;
  try{
    const old=JSON.parse(localStorage.getItem(KEY));
    if(old&&typeof old==='object'){
      for(const k of FIELDS)if(typeof old.fields?.[k]==='string')state.fields[k]=old.fields[k].slice(0,k==='projectName'?50:4000);
      for(const k of CHECKS)state.checks[k]=old.checks?.[k]===true;
      for(const k of Object.keys(ANSWERS))if(typeof old.votes?.[k]==='string')state.votes[k]=old.votes[k].slice(0,20);
    }
  }catch{}
  function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(timer);timer=setTimeout(()=>$('#toast').classList.remove('show'),3000);}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{toast('임시 저장을 쓸 수 없습니다. 마지막에 제작 기록 TXT를 저장하세요.');}progress();}
  function progress(){const n=CHECKS.filter(k=>state.checks[k]).length;$('#progress').value=n;$('#progress-label').textContent=n+' / 6';}
  function createPrompt(){return `첨부한 제작자료를 사용해서 사주·타로 건강정보 챗봇 웹페이지를 만들어줘.\n생년월일 입력, 사주 카드, 타로 카드 선택, 음식·영양정보, 문답창이 이어지게 해줘.\n제공된 계산·자료·연결 파일을 사용하고 필수 id와 네 스크립트 연결을 유지해줘.\n서비스 이름: ${state.fields.projectName||'사주·타로 건강정보 챗봇'}\n화면 구성: ${state.fields.theme||'사주 → 타로 → 음식 → 문답 순서'}\n추가 설치·CDN·API 없이 index.html로 저장해 실행할 수 있게 하고 CSS는 HTML 안에 넣어줘.\n재미용 카드와 출처가 있는 건강정보를 구분하고 제목과 안내는 기능 위주로 간단히 써줘.\n완전한 index.html만 HTML 코드 블록 하나로 출력해줘.`;}
  function fixPrompt(){return `첨부한 내 index.html에서 다음 문제 한 가지만 고쳐 줘.\n관찰한 문제: ${state.fields.before||'[내가 직접 관찰한 문제 한 가지]'}\n기존 네 스크립트 연결, 계산 규칙과 필수 id를 유지해.\n추가 설치·외부 통신 없이 실행되는 완전한 index.html만 출력해 줘.\n어떤 테스트로 고쳐졌는지 확인할 수 있는지도 코드 뒤에 짧게 알려 줘.`;}
  function prompts(){$('#create-prompt').textContent=createPrompt();$('#fix-prompt').textContent=fixPrompt();}
  function download(name,text){const u=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000);}
  function record(){return `부산보건고 · 보건간호과 실습 기록\n서비스 이름: ${state.fields.projectName||'미입력'}\n화면 구성: ${state.fields.theme||'기본'}\n\n건강정보 확인\n${state.fields.factNote||'미입력'}\n\n문제와 수정\n바꾸기 전: ${state.fields.before||'미입력'}\n다시 확인: ${state.fields.after||'미입력'}\n\n내가 설명할 수 있는 것\n${state.fields.reflection||'미입력'}\n\n진행 체크(학생의 자기 기록)\n${CHECKS.map(k=>k+': '+(state.checks[k]?'체크':'미체크')).join('\n')}\n\n체크나 기록 저장만으로 실제 파일 전달 또는 계산의 정확성이 확인되는 것은 아닙니다.\n최종 전달물: index.html, 네 JS 파일과 assets 폴더를 포함한 ZIP과 이 기록 파일.\n`;}
  function vote(id){const value=state.votes[id];if(!value||!ANSWERS[id])return;const reply=$('#reply-'+id);reply.hidden=false;reply.textContent=(value===ANSWERS[id][0]?'선택한 이유를 설명해 보세요. ':'한 번 더 확인해 봅시다. ')+ANSWERS[id][1];$$(`[data-vote="${id}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===value)));}
  function demo(){try{const [date,time]=CASES[Number($('#demo-case').value)||0],r=Saju.calculate(date,time);$('#demo-pillars').replaceChildren(...r.pillars.map(p=>{const div=document.createElement('div');for(const [tag,text]of [['small',p.label],['b',p.hanja],['span',p.korean]]){const el=document.createElement(tag);el.textContent=text;div.append(el);}return div;}));}catch{$('#demo-pillars').textContent='예시는 다운로드한 시작 키트에서 확인하세요.';}}
  function route(){const requested=location.hash.slice(1)||'home';if(requested==='main'){$('#main').focus();return;}const id=$$('[data-page]').some(s=>s.dataset.page===requested)?requested:'home';$$('[data-page]').forEach(s=>s.hidden=s.dataset.page!==id);$$('nav a').forEach(a=>{if(a.hash==='#'+id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});window.scrollTo(0,0);}
  $$('[data-field]').forEach(el=>{if(state.fields[el.dataset.field]){if(el.tagName!=='SELECT'||Array.from(el.options).some(o=>o.value===state.fields[el.dataset.field]))el.value=state.fields[el.dataset.field];else state.fields[el.dataset.field]=el.value;}el.addEventListener('input',()=>{state.fields[el.dataset.field]=el.value.slice(0,el.dataset.field==='projectName'?50:4000);save();prompts();});});
  $$('[data-check]').forEach(el=>{el.checked=state.checks[el.dataset.check]===true;el.addEventListener('change',()=>{state.checks[el.dataset.check]=el.checked;save();});});
  $$('[data-vote]').forEach(el=>el.addEventListener('click',()=>{state.votes[el.dataset.vote]=el.dataset.value;vote(el.dataset.vote);save();}));
  $$('[data-copy]').forEach(el=>el.addEventListener('click',async()=>{const text=el.dataset.copy==='create'?createPrompt():fixPrompt();try{await navigator.clipboard.writeText(text);toast('복사했습니다. AI 채팅에 붙여 넣으세요.');}catch{download('AI요청문.txt',text);toast('요청문 TXT를 저장했습니다. 열어서 복사하세요.');}}));
  $$('[data-save]').forEach(el=>el.addEventListener('click',()=>download(el.dataset.save==='record'?'AI서비스-제작기록.txt':'AI서비스-첫요청문.txt',el.dataset.save==='record'?record():createPrompt())));
  const body=$('#fixture-rows');for(const args of CASES){const r=Saju.calculate(...args),tr=document.createElement('tr');for(const text of [args.join(' '),...r.pillars.map(p=>p.hanja+' '+p.korean)]){const td=document.createElement('td');td.textContent=text;tr.append(td);}body.append(tr);}
  $('#demo-case').addEventListener('change',demo);window.addEventListener('hashchange',route);for(const k of Object.keys(ANSWERS))vote(k);progress();prompts();demo();route();
})();
