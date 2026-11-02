import { useQuery } from '@tanstack/react-query';
import { keys } from '@/lib/query-keys';
import { fetchSupportResources } from '@/lib/node-admin-api';
import { supportRecordName } from '@/lib/admin-tasks';
import { fieldOptions, supportDisplayValue } from '@/lib/node-admin';
import { quizCompletionMode, quizQuestions, questionChoiceText } from '@/lib/quiz-authoring';
import { quizAnswerText } from '@/lib/quiz-answer';
import { JOURNEY_STEP_TYPES, readJourneySteps, readExitPackage } from '@/lib/journey-authoring';
import type { SupportField, SupportRecord, SupportResourceSpec } from '@/types/node-admin';

function ReferenceName({id,family,labels,owner,organization}:{id:string;family:string;labels:Record<string,string>;owner:string;organization?:string}) {
  const query = useQuery({queryKey:[...keys.nodeAdmin.all,owner,'review-reference',family,organization,id],queryFn:()=>fetchSupportResources(family,{organization_id:organization,q:id,per_page:20}),enabled:!labels[id] && !!id});
  const match = query.data?.items.find(record=>record.id===id);
  return <span>{labels[id] || (match ? supportRecordName(match) : query.isFetching ? 'Loading record name…' : 'Record name unavailable')} <span className="text-xs break-all">({id})</span></span>;
}

function StructuredReview({value}:{value:unknown}) {
  if (Array.isArray(value)) return value.length ? <ul className="list-disc pl-5 space-y-2">{value.map((item,index)=><li key={index}><StructuredReview value={item}/></li>)}</ul> : <span>No items</span>;
  if (value && typeof value==='object') return <dl className="space-y-2 border-l border-border pl-3">{Object.entries(value).map(([name,item])=><div key={name}><dt className="font-semibold">{name.replaceAll('_',' ')}</dt><dd><StructuredReview value={item}/></dd></div>)}</dl>;
  return <span className="whitespace-pre-wrap break-words">{supportDisplayValue(value)}</span>;
}

export function SupportValueReview({name,value,field,labels,owner,organization}:{name:string;value:unknown;field?:SupportField;labels:Record<string,string>;owner:string;organization?:string}) {
  const reference=(id:string,family:string)=><ReferenceName id={id} family={family} labels={labels} owner={owner} organization={organization}/>;
  let content:React.ReactNode;
  try {
    if (name==='survey_json') {
      const questions=quizQuestions(typeof value==='string'?value:JSON.stringify(value));
      content=<div className="space-y-3"><p className="font-semibold">{quizCompletionMode(questions)==='graded'?'Knowledge quiz: server grades questions with an answer key.':'Completion questionnaire: preferences are not marked right or wrong.'}</p><ol className="list-decimal pl-5 space-y-3">{questions.map(question=><li key={question.name}><strong>{question.title}</strong><p>{question.type.replaceAll('_',' ')} · {question.isRequired===false?'Optional':'Required'}</p>{question.choices && <p>Choices: {question.choices.map(questionChoiceText).join('; ')}</p>}<p>{question.correctAnswer!=null ? `Answer key: ${quizAnswerText(question.correctAnswer,question.choices)}` : 'No answer key: completion only'}</p></li>)}</ol></div>;
    } else if (name==='content_sequence') {
      const steps=readJourneySteps(typeof value==='string'?value:JSON.stringify(value));
      content=<ol className="list-decimal pl-5 space-y-3">{steps.map((step,index)=><li key={index}><strong>{step.title}</strong><p>{JOURNEY_STEP_TYPES.find(([type])=>type===step.type)?.[1] || step.type} · {step.required?'Required':'Optional'}</p>{step.description&&<p className="whitespace-pre-wrap">{step.description}</p>}{step.quiz_id&&<p>Quiz or questionnaire: {reference(step.quiz_id,'quizzes')}</p>}{step.video_url&&<p className="break-all">Video: {step.video_url}</p>}{step.confirmation_label&&<p>Acknowledgement: {step.confirmation_label}</p>}{step.reflection_prompt&&<p>Reflection: {step.reflection_prompt}</p>}{step.choices&&<ul className="list-disc pl-5">{step.choices.map(choice=><li key={choice.value}>{choice.label}{choice.description?`: ${choice.description}`:''} · {step.choice_routes?.[choice.value]===steps.length?'Finish journey':`Continue to step ${(step.choice_routes?.[choice.value]??index+1)+1}`}</li>)}</ul>}</li>)}</ol>;
    } else if (name==='exit_package') {
      const exit=readExitPackage(typeof value==='string'?value:JSON.stringify(value));
      content=<div className="space-y-3"><p className="font-semibold">Participant take-away package</p>{!!exit.docs?.length&&<div><h4 className="font-semibold">Documents</h4><ul className="list-disc pl-5">{exit.docs.map((item,index)=><li key={index}>{item.title}<span className="block break-all text-sm">{item.url}</span></li>)}</ul></div>}{!!exit.tools?.length&&<div><h4 className="font-semibold">Tools</h4><ul className="list-disc pl-5">{exit.tools.map((item,index)=><li key={index}>{item.name}: {item.description}<span className="block break-all text-sm">{item.url}</span></li>)}</ul></div>}{!!exit.next_steps?.length&&<div><h4 className="font-semibold">Suggested next steps</h4><ol className="list-decimal pl-5">{exit.next_steps.map((item,index)=><li key={index}>{item}</li>)}</ol></div>}{!exit.docs?.length&&!exit.tools?.length&&!exit.next_steps?.length&&<p>No documents, tools or next steps configured.</p>}</div>;
    } else if (field?.reference && typeof value==='string' && value) content=reference(value,field.reference.split('.')[0]);
    else {
      const option=field && fieldOptions(field).find(option=>option.value===String(value));
      content=option?<span>{option.label}</span>:<StructuredReview value={value}/>;
    }
  } catch { content=<p>The structured preview is unavailable. Return to the editor and check this field before confirming.</p>; }
  return <div className="space-y-2 break-words"><h3 className="font-bold">{field?.label || name.replaceAll('_',' ')}</h3>{content}{value!=null && typeof value==='object'&&<details><summary className="min-h-11 cursor-pointer py-3 text-sm">Advanced: exact {field?.label.toLowerCase() || name} data</summary><pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(value,null,2)}</pre></details>}</div>;
}

export function QuizRequirementsReview({values,record,spec,labels,owner,organization}:{values:Record<string,unknown>;record:SupportRecord|null;spec:SupportResourceSpec;labels:Record<string,string>;owner:string;organization?:string}) {
  const effective={...record,...values};
  let graded=false;
  try { graded=quizCompletionMode(quizQuestions(JSON.stringify(effective.survey_json)))==='graded'; } catch { /* Field validation presents malformed questions before review. */ }
  return <section className="space-y-3 border border-border p-3" aria-label="Quiz entry policy summary"><h3 className="font-bold">Effective entry requirements</h3><p>{effective.is_published===true?'Published: candidates can open it.':'Unpublished: candidates cannot complete it yet.'} {effective.is_entry_quiz===true?'Required for entry to its assigned scope.':'Not an entry requirement.'}</p><p>{graded?`Knowledge quiz: server pass threshold ${effective.passing_score ?? 70}%.`:'Completion questionnaire: meaningful answers are required; no passing score or right-or-wrong judgment is applied.'}</p>{organization&&<p>Ecosystem: <ReferenceName id={organization} family="ecosystems" labels={labels} owner={owner}/></p>}{['domain_id','team_id','course_id'].filter(name=>effective[name]).map(name=><SupportValueReview key={name} name={name} value={effective[name]} field={spec.fields.find(field=>field.name===name)} labels={labels} owner={owner} organization={organization}/>)}{!effective.domain_id&&!effective.team_id&&!effective.course_id&&<p>Ecosystem-wide scope.</p>}</section>;
}
