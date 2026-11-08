(function(){
 'use strict';
 const $=id=>document.getElementById(id),D=globalThis.HealthCardData,C=globalThis.HealthCardCore;
 const form=$('saju-form');if(!form)return;
 let saju=null,tarot=null,deck=[],offset=0,selectedFood=null;
 const ctx=()=>({saju,tarot,group:$('food-group').value,excluded:Array.from(document.querySelectorAll('[data-food-exclude]:checked'),e=>e.value),offset,selectedFood});
 const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
 function clearSaju(){saju=null;tarot=null;selectedFood=null;offset=0;$('result').hidden=true;$('tarot-stage').hidden=true;$('food-stage').hidden=true;$('chat-stage').hidden=true;$('error').textContent='';$('chat-messages').replaceChildren();}
 function message(text,user=false,sources=[]){
  const bubble=el('div',undefined,'message'+(user?' user':''));bubble.append(el('small',user?'나':'자료 문답'),document.createTextNode(text));
  for(const source of sources){if(!/^https:\/\//.test(source.url))continue;const a=el('a',source.title+' ↗');a.href=source.url;a.target='_blank';a.rel='noopener';bubble.append(a);}
  const log=$('chat-messages');log.append(bubble);while(log.children.length>60)log.firstElementChild.remove();log.scrollTop=log.scrollHeight;
 }
 function showNutrition(id){
  const food=D.foods.find(f=>f.id===id),detail=$('food-detail');detail.replaceChildren();
  if(!food){detail.append(el('p','음식을 선택하면 영양정보가 표시됩니다.','empty'));return;}
  selectedFood=food.id;detail.append(el('h3',food.name));const table=el('table',undefined,'nutrition-table');table.append(el('caption',food.sourceFoodName+' · 100g 기준'));
  const tbody=el('tbody');for(const [key,label]of Object.entries(C.nutrientNames)){const row=el('tr'),value=food.nutrients[key];const th=el('th',label);th.scope='row';row.append(th,el('td',value?value.value+' '+value.unit:'자료 없음'));tbody.append(row);}table.append(tbody);detail.append(table);
  const source=el('p',undefined,'food-source'),link=el('a','식약처 원문 확인 ↗');link.href=food.source.url;link.target='_blank';link.rel='noopener';source.append(link,document.createTextNode('\n식품 코드: '+food.source.code+'\n확인일: '+food.source.checked));source.style.whiteSpace='pre-line';detail.append(source);
  if(food.allergens.length)detail.append(el('p','이 예시 식품의 확인할 원재료: '+food.allergens.join(', '),'food-note'));
  for(const button of document.querySelectorAll('[data-food]'))button.setAttribute('aria-pressed',String(button.dataset.food===id));
 }
 function showFoods(){
  const list=C.candidates(ctx()),wrap=$('food-list');wrap.replaceChildren();
  if(!list.length){selectedFood=null;wrap.append(el('p','현재 설정에 맞는 음식이 없습니다. 종류나 제외 항목을 바꿔 주세요.','empty'));$('next-food').disabled=true;showNutrition(null);return;}
  $('next-food').disabled=list.length<2;
  for(const food of list.slice(0,2)){const button=el('button',undefined,'food-button');button.type='button';button.dataset.food=food.id;const image=el('img');image.src=food.image;image.alt=food.name+' · AI 생성 예시';image.loading='lazy';const copy=el('span');copy.append(el('b',food.name),el('small',food.group+' · 100g 영양정보'),el('small','에너지 '+food.nutrients.energy.value+' kcal'));button.append(image,copy);button.addEventListener('click',()=>showNutrition(food.id));wrap.append(button);}
  showNutrition(list[0].id);
 }
 function send(question){
  const q=String(question||'').trim().slice(0,500);if(!q)return;message(q,true);
  const result=C.answer(q,ctx());
  if(result.action==='next-food'){offset++;showFoods();}
  if(result.foodId){const allowed=C.candidates(ctx()).some(f=>f.id===result.foodId);if(allowed)showNutrition(result.foodId);}
  message(result.text,false,result.sources);
 }
 function reveal(id){
  tarot=id;const card=D.tarot.find(c=>c.id===id),wrap=$('tarot-result');wrap.replaceChildren();
  const image=el('img');image.src=card.image;image.alt=card.name+' · AI 제작 카드';const text=el('div');text.append(el('span','재미용 건강 운세','pill'),el('h3',card.name),el('p',card.fortune,'fortune'),el('p','연결 주제: '+card.topic,'small'));const ask=el('button','이 카드로 질문하기','secondary');ask.type='button';ask.addEventListener('click',()=>{send(card.question);$('chat-stage').scrollIntoView({block:'start',behavior:'auto'});});text.append(ask);wrap.append(image,text);wrap.hidden=false;
  for(const button of document.querySelectorAll('[data-tarot]')){button.setAttribute('aria-pressed',String(button.dataset.tarot===id));button.disabled=true;}
  $('food-stage').hidden=false;$('chat-stage').hidden=false;offset=0;showFoods();
  if(!$('chat-messages').children.length)message('사주 결과, 오늘 카드, 음식의 영양정보를 물어볼 수 있어요. 예: “우유 200g 칼슘은?”');
  else message('새로 고른 카드: '+card.name+'. 현재 카드와 음식 설정으로 답할게요.');
 }
 function shuffleDeck(){
  deck=C.shuffle().slice(0,3);tarot=null;$('tarot-result').hidden=true;$('food-stage').hidden=true;$('chat-stage').hidden=true;$('tarot-deck').replaceChildren();
  for(const [i,id]of deck.entries()){const button=el('button',undefined,'tarot-choice');button.type='button';button.dataset.tarot=id;button.setAttribute('aria-label',(i+1)+'번 타로 카드 선택');button.append(el('span',(i+1)+'번 카드'));button.addEventListener('click',()=>reveal(id));$('tarot-deck').append(button);}
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();clearSaju();
  try{
   if(!globalThis.Saju||!D||!C)throw Error('계산·자료 파일이 없습니다. 압축을 푼 폴더 전체를 확인해 주세요.');
   saju=Saju.calculate($('birth-date').value,$('birth-time').value);const summary=C.sajuSummary(saju),card=summary.card;
   $('result-date').textContent=saju.date+' '+saju.time+' · KST';$('pillars').replaceChildren(...saju.pillars.map(p=>{const box=el('div',undefined,'pillar');box.append(el('small',p.label),el('b',p.hanja,'hanja'),el('span',p.korean));return box;}));
   $('elements').replaceChildren(...Object.entries(saju.counts).map(([name,count])=>{const box=el('div',name,'element');box.append(el('b',count+'개'));return box;}));
   $('saju-summary').textContent='년지 기준 띠: '+summary.zodiac+' · 일간: '+summary.stem.hanja+'('+summary.stem.korean+') · '+summary.stem.polarity+summary.stem.element;
   const image=el('img');image.src=card.image;image.alt=card.name+' · AI 제작 카드';$('element-card').replaceChildren(image,el('b',card.name),el('p',card.symbol));
   $('story-title').textContent=card.name;$('story-text').textContent=card.reading+' '+card.description;$('result').hidden=false;$('tarot-stage').hidden=false;shuffleDeck();
  }catch(err){clearSaju();$('error').textContent=err.message;}
 });
 form.addEventListener('input',clearSaju);form.addEventListener('reset',clearSaju);
 $('sample-button').addEventListener('click',()=>{clearSaju();$('birth-date').value='2005-12-23';$('birth-time').value='08:37';});
 $('print-button').addEventListener('click',()=>window.print());$('redraw-button').addEventListener('click',shuffleDeck);
 for(const food of D.foods){const label=el('label'),input=el('input');input.type='checkbox';input.value=food.id;input.dataset.foodExclude='';input.addEventListener('change',()=>{offset=0;showFoods();});label.append(input,document.createTextNode(food.name));$('food-exclusions').append(label);}
 $('food-group').addEventListener('change',()=>{offset=0;showFoods();});$('next-food').addEventListener('click',()=>{offset++;showFoods();});
 const quick=['사주 결과 설명해줘','오늘 카드는?','오늘 음식 후보를 보여줘','선택한 음식 영양정보','다른 음식 보여줘','청소년 수면 정보를 알려줘','자료 출처는?'];
 for(const question of quick){const button=el('button',question);button.type='button';button.addEventListener('click',()=>send(question));$('quick-questions').append(button);}
 $('chat-form').addEventListener('submit',event=>{event.preventDefault();send($('chat-input').value);$('chat-input').value='';$('chat-input').focus();});
})();
