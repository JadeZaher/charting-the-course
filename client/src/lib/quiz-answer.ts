export type QuizChoiceValue = string | number | boolean;
export type QuizChoice = QuizChoiceValue | {value:QuizChoiceValue;text?:string};
export interface QuizElement {type:string;name:string;title:string;choices?:QuizChoice[];isRequired?:boolean;rateMin?:number;rateMax?:number;minRateDescription?:string;maxRateDescription?:string}
export function quizChoices(choices:QuizChoice[] = []) {
 const values=choices.map((choice,index)=>({key:`choice_${index}`,value:typeof choice==='object'?choice.value:choice,text:typeof choice==='object'?choice.text??String(choice.value):String(choice)}));
 return values.map(choice=>({...choice,text:values.filter(item=>item.text===choice.text).length>1?`${choice.text} (${typeof choice.value==='string'?'text':typeof choice.value})`:choice.text}));
}
export function quizChoiceKey(choices:QuizChoice[]|undefined,value:unknown):string{return quizChoices(choices).find(choice=>choice.value===value)?.key??'';}
export function quizChoiceValue(choices:QuizChoice[]|undefined,key:string):QuizChoiceValue|undefined{return quizChoices(choices).find(choice=>choice.key===key)?.value;}
export function quizAnswerText(answer:unknown,choices?:QuizChoice[]):string {
 if(answer===undefined||answer===null)return 'Not answered';
 if(Array.isArray(answer))return answer.length?answer.map(item=>quizAnswerText(item,choices)).join(', '):'Not answered';
 const choice=choices?.find(choice=>(typeof choice==='object'?choice.value:choice)===answer);
 if(choice && typeof choice==='object' && choice.text)return choice.text;
 if(typeof answer==='boolean')return answer?'Yes':'No';
 return String(answer);
}
export function hasQuizAnswer(answers:Record<string,unknown>):boolean{return Object.values(answers).some(answer=>answer!==undefined&&answer!==null&&answer!==''&&(!Array.isArray(answer)||answer.length>0));}
export function quizElements(data:unknown):QuizElement[]{const quiz=data as {survey_json?:{elements?:QuizElement[];pages?:Array<{elements?:QuizElement[]}>};config?:{elements?:QuizElement[];pages?:Array<{elements?:QuizElement[]}>};questions?:Array<{id:string;text:string;type:string;options?:Array<{id:string;text:string}>}>};const config=quiz.survey_json||quiz.config;if(config)return [...(config.elements||[]),...(config.pages||[]).flatMap(page=>page.elements||[])].filter(element=>!['html','image'].includes(element.type)).map(element=>({type:element.type,name:element.name,title:element.title,choices:element.choices,isRequired:element.isRequired!==false,rateMin:element.rateMin,rateMax:element.rateMax,minRateDescription:element.minRateDescription,maxRateDescription:element.maxRateDescription}));return (quiz.questions||[]).map(question=>({name:question.id,title:question.text,type:question.type==='multiple_choice'?'radiogroup':question.type==='true_false'?'boolean':'text',choices:question.options?.map(option=>({value:option.id,text:option.text})),isRequired:true}));}
export function quizAnswerErrors(elements:QuizElement[],answers:Record<string,unknown>):string[]{if(!elements.length)return ['This quiz has no usable questions. Ask a steward to repair it.'];return elements.flatMap((element,index)=>{if(!['radiogroup','checkbox','dropdown','boolean','rating','text','comment'].includes(element.type))return [`Question ${index+1} uses an unavailable format. Ask a steward to repair this quiz.`];const answer=answers[element.name];return element.isRequired!==false&&(answer===undefined||answer===null||typeof answer==='string'&&!answer.trim()||Array.isArray(answer)&&!answer.length)?[`Answer question ${index+1}: ${element.title}`]:[];});}
