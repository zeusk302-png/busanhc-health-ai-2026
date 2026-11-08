(function(root){
  'use strict';
  const data=typeof module==='object'&&module.exports?require('./health-card-data.js'):root.HealthCardData;
  const branches='子丑寅卯辰巳午未申酉戌亥';
  const nutrientNames={energy:'에너지',carbohydrate:'탄수화물',protein:'단백질',fat:'지방',fiber:'식이섬유',sodium:'나트륨',calcium:'칼슘'};
  function elementCard(saju){return data.elements.find(c=>c.element===saju.dayElement);}
  function sajuSummary(saju){
    const stem=data.stems.find(s=>s.hanja===saju.pillars[2].hanja[0]);
    const zodiac=data.zodiac[branches.indexOf(saju.pillars[0].hanja[1])];
    return {stem,zodiac,card:elementCard(saju)};
  }
  function shuffle(random=Math.random){
    const result=data.tarot.map(c=>c.id);
    for(let i=result.length-1;i>0;i--){const raw=random();const j=Math.min(i,Math.max(0,Math.floor(raw*(i+1))));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  }
  function candidates({group='전체',excluded=[],offset=0}={}){
    const safe=Array.isArray(excluded)?excluded:[];
    const eligible=data.foods.filter(f=>(group==='전체'||f.group===group)&&!safe.includes(f.id));
    if(!eligible.length)return [];
    const start=((Math.trunc(offset)%eligible.length)+eligible.length)%eligible.length;
    return [...eligible.slice(start),...eligible.slice(0,start)];
  }
  function nutrition(food,grams=100){
    if(!food||!Number.isFinite(grams)||grams<=0||grams>2000)throw Error('자료에 있는 음식과 1~2000g 범위의 보기용 중량을 사용하세요.');
    return Object.fromEntries(Object.entries(food.nutrients).map(([key,item])=>[key,item?{value:Math.round(item.value*grams/food.basis.value*100)/100,unit:item.unit}:null]));
  }
  function format(food,grams=100,key){
    const n=nutrition(food,grams);
    const keys=key?[key]:['energy','carbohydrate','protein','fat','fiber','sodium','calcium'];
    return `${food.name} ${grams}g 기준\n`+keys.map(k=>`${nutrientNames[k]}: ${n[k]?n[k].value+' '+n[k].unit:'자료 없음'}`).join('\n');
  }
  function answer(question,context={}){
    const q=String(question||'').trim().slice(0,500),sources=[];
    if(!q)return {text:'음식 이름이나 궁금한 항목을 입력해 주세요.',sources};
    if(/쓰러|의식.{0,4}없|숨.{0,4}(안|못)/.test(q))return {text:'실제 위급한 상황이면 이 문답을 기다리지 말고 즉시 주변 어른과 119에 도움을 요청하세요.',sources};
    if(/진단|병명|질병|복용|치료|증상|통증|아프|약(을|이|먹|추천|종류|이름)|다이어트|살.{0,2}빼|칼로리.{0,3}목표/.test(q.replace(/\s+/g,'')))return {text:'이 예시는 개인 진단·약·치료·감량 계획을 정하는 자료가 없습니다. 보건 선생님이나 의료진에게 상담해 주세요.',sources};
    if(/알레르기|알러지|먹어도.{0,3}(돼|되)|섭취.{0,3}가능/.test(q))return {text:'이 자료로 개인의 섭취 가능 여부를 판단할 수 없습니다. 피할 음식은 후보에서 제외하고 실제 제품의 원재료·알레르기 표시와 조리 환경을 확인하세요. 필요한 경우 보건 선생님이나 의료진에게 문의하세요.',sources:[data.sources.nutrition]};
    if(/사주|오행|띠|일간/.test(q)&&!/음식|영양|몸|건강|운세|체질|부족|결핍/.test(q)){
      if(!context.saju)return {text:'먼저 양력 날짜와 시각을 넣어 사주 카드를 계산해 주세요.',sources};
      const r=context.saju,s=sajuSummary(r);
      return {text:r.pillars.map(p=>p.label+': '+p.hanja+'('+p.korean+')').join('\n')+`\n년지 기준 띠: ${s.zodiac}\n일간: ${s.stem.hanja}(${s.stem.korean}) · ${s.stem.polarity}${s.stem.element}\n`+Object.entries(r.counts).map(([k,v])=>k+' '+v+'개').join(' / ')+'\n이 개수는 여덟 겉글자의 분류이며 건강 점수가 아닙니다.',sources};
    }
    if(/운세|오늘.{0,3}카드|타로.{0,3}결과/.test(q)){
      const card=data.tarot.find(c=>c.id===context.tarot);
      return {text:card?`${card.name}\n재미용 건강 운세: ${card.fortune}\n이 카드는 무작위로 뽑으며 건강 상태를 판단하지 않습니다.`:'사주 결과 아래에서 뒤집힌 카드 한 장을 골라 보세요.',sources};
    }
    if(/건강.{0,5}(알려|맞|예측)|체질|부족|결핍|사주.{0,5}(음식|몸|건강)|타로.{0,5}(음식|몸|건강)/.test(q))return {text:'사주 풀이와 타로 운세는 재미로 보는 문구입니다. 실제 건강 상태나 필요한 영양소를 알아내는 기능은 없습니다. 음식 후보는 종류·제외 설정에서 고르고 영양정보는 식약처 자료로 보여줍니다.',sources:[data.sources.nutrition]};
    if(/수면|잠|휴식/.test(q))return {text:'CDC는 13~17세의 하루 권장 수면 시간을 8~10시간으로 안내합니다. 연령을 확인하고, 수면 문제가 계속되면 의료진과 상담하세요.',sources:[data.sources.sleep]};
    if(/다른.{0,4}음식|다음.{0,4}음식|추천|음식.{0,4}후보/.test(q)){
      const list=candidates(context);
      return {text:list.length?'현재 설정의 음식 후보: '+list.map(f=>f.name).join(', ')+'.\n선호 종류와 제외 설정에 따라 표시하며, 사주에 따른 의학적 맞춤 처방이 아닙니다.':'현재 설정에 맞는 음식 후보가 없습니다. 제외 항목이나 음식 종류를 바꿔 주세요.',sources:[data.sources.nutrition],action:/다른|다음/.test(q)?'next-food':null};
    }
    if(/카드|타로|운세/.test(q)){
      const card=data.tarot.find(c=>c.id===context.tarot);
      return {text:card?`${card.name}\n재미용 건강 운세: ${card.fortune}\n이 카드는 무작위로 뽑으며 건강 상태를 판단하지 않습니다.`:'사주 결과 아래에서 뒤집힌 카드 한 장을 골라 보세요.',sources};
    }
    const named=data.foods.find(f=>q.includes(f.name)||q.includes(f.id));
    const food=named||data.foods.find(f=>f.id===context.selectedFood);
    const nutrient=Object.entries(nutrientNames).find(([,label])=>q.includes(label))?.[0];
    if(food&&(named||nutrient||/영양|성분|몇|중량/.test(q))){
      const match=q.match(/(\d+(?:\.\d+)?)\s*(?:g|그램)/i),grams=match?Number(match[1]):100;
      try{return {text:format(food,grams,nutrient)+(grams!==100?'\n100g 기준값에 중량 비율을 곱한 계산입니다.':'')+'\n음식의 종류·조리 상태·제품에 따라 값이 달라질 수 있습니다.',sources:[{title:food.source.agency+' · '+food.sourceFoodName,url:food.source.url}],foodId:food.id};}
      catch(err){return {text:err.message,sources};}
    }
    if(/출처|자료|근거/.test(q))return {text:'영양정보는 식약처 K-FIND의 식품 코드별 자료, 수면 정보는 CDC 안내를 사용합니다. 각 답변 아래 원문을 열어 확인할 수 있습니다.',sources:[data.sources.nutrition,data.sources.sleep]};
    return {text:'준비된 자료에서는 그 질문의 답을 찾지 못했어요. 사주 결과, 오늘 카드, 여섯 음식의 영양정보, 청소년 수면 정보를 물어볼 수 있어요. 예: “두부 단백질은?”, “우유 200g 칼슘은?”',sources};
  }
  const api={elementCard,sajuSummary,shuffle,candidates,nutrition,format,answer,nutrientNames};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.HealthCardCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
