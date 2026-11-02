import {test} from 'node:test';
import assert from 'node:assert/strict';
import {adminTaskFromPath,ADMIN_TASKS,supportRecordName} from './admin-tasks';
import {consentGateRedirect} from './consent-gate';
import {joinReturnPath,quizForJoin,joinGateMessage,type JoinGates} from './join-gates';
import {quizQuestions,serializeQuiz,quizQuestionErrors,quizCompletionMode} from './quiz-authoring';
import {quizChoices,quizChoiceKey,quizChoiceValue,quizElements,quizAnswerErrors} from './quiz-answer';
import {journeyDestination,previousJourneyStep,reorderJourneySteps} from './journey-routing';
import type {JourneyStep} from '../types/orientation';
import {readJourneySteps,readExitPackage,journeyErrors} from './journey-authoring';
import {emptyMatchingConfiguration,matchingConfigurationErrors} from './matching-authoring';
import {showFitEstimate,type MatchingResult} from './matching';
import {portableRecordPath} from './chat-links';
import {hasQuizAnswer} from './quiz-answer';
import {contactMemberFromQuery} from './exchange';

test('node task links resolve to concrete audited resource families and recognizable record names',()=>{for(const task of ADMIN_TASKS){assert.equal(adminTaskFromPath(`/admin/${task.key}`)?.key,task.key);assert.ok(task.resources.length);}assert.equal(adminTaskFromPath('/admin'),undefined);assert.equal(adminTaskFromPath('/admin/not-a-task'),undefined);assert.ok(ADMIN_TASKS.find(task=>task.key==='circles')?.resources.includes('circle_memberships'));assert.equal(supportRecordName({id:'id',display_name:'Jules'}),'Jules');});
test('node administrators retain task access while pending; ordinary users retain their gate',()=>{const input={isAuthenticated:true,pendingConsents:[{ecosystem_id:'e',required_agreements:[]}],memberships:[{id:'e',membership_status:'pending_consent'}],member:null};for(const path of ['/admin','/admin/users','/admin/learning','/admin/teams']){assert.equal(consentGateRedirect({...input,path,isNodeAdmin:true}),null);assert.equal(consentGateRedirect({...input,path,isNodeAdmin:false}),'/welcome/consent');}for(const path of ['/quiz/take/q','/quiz/results/r'])assert.equal(consentGateRedirect({...input,path}),null);});
test('quiz return links cannot leave the app or loop back into a quiz',()=>{assert.equal(joinReturnPath('?returnTo=%2Fteams%2Ft1'),'/teams/t1');assert.equal(joinReturnPath('?returnTo=https%3A%2F%2Fevil.test'),'/my-quiz-history');assert.equal(joinReturnPath('?returnTo=%2F%2Fevil.test'),'/my-quiz-history');assert.equal(joinReturnPath('?returnTo=%2Fquiz%2Ftake%2Fother'),'/my-quiz-history');assert.equal(quizForJoin('q1','/ethos/e1'),'/quiz/take/q1?returnTo=%2Fethos%2Fe1');});
test('join guidance distinguishes no requirement, configured quiz and unavailable configuration',()=>{const gate:JoinGates={target_type:'ecosystem',target_id:'e',eligible:true,status:'ready',required_quizzes:[],required_agreements:[]};assert.match(joinGateMessage(gate),/No entry quiz/);assert.match(joinGateMessage({...gate,eligible:false,status:'quiz_required'}),/graded by the server/);assert.match(joinGateMessage({...gate,eligible:false,status:'quiz_unavailable'}),/cannot be skipped/);});
test('quiz editor preserves a server-compatible key and validates wrong answer references',()=>{const questions=[{name:'q1',type:'radiogroup',title:'Which commitment?',choices:['A','B'],correctAnswer:'B',isRequired:true}];assert.deepEqual(quizQuestions(serializeQuiz(questions)),questions);assert.deepEqual(quizQuestionErrors(questions),[]);assert.ok(quizQuestionErrors([{...questions[0],correctAnswer:'C'}]).length);assert.ok(quizQuestionErrors([]).length);});
test('valid readiness questionnaires use completion instead of grading personal preferences',()=>{const questions=[{name:'ready',type:'boolean',title:'Ready?'},{name:'purpose',type:'comment',title:'Your expectations?'},{name:'time',type:'radiogroup',title:'Available time?',choices:['1-2 hours','3-5 hours']}];assert.deepEqual(quizQuestionErrors(questions),[]);assert.equal(quizCompletionMode(questions),'completion');assert.equal(quizCompletionMode([{...questions[0],correctAnswer:true}]),'graded');const gate:JoinGates={target_type:'ecosystem',target_id:'e',eligible:false,status:'quiz_required',required_quizzes:[{id:'q',title:'Readiness',scope_type:'ecosystem',scope_id:'e',status:'required',completion_mode:'completion',href:'/quiz/take/q'}],required_agreements:[]};assert.match(joinGateMessage(gate),/without grading personal preferences/);assert.deepEqual(quizAnswerErrors(questions,{ready:false,purpose:'I want to support community decisions.',time:'1-2 hours'}),[]);assert.ok(quizAnswerErrors(questions,{ready:false}).length);});
test('candidate question adapter excludes answer keys and accepts SurveyJS object options',()=>{const elements=quizElements({survey_json:{pages:[{elements:[{name:'q',type:'radiogroup',title:'Pick',choices:[{value:'a',text:'A'}],correctAnswer:'a',isRequired:true}]}]}});assert.equal('correctAnswer' in elements[0],false);assert.deepEqual(elements[0].choices,[{value:'a',text:'A'}]);assert.ok(quizAnswerErrors(elements,{}).length);assert.deepEqual(quizAnswerErrors(elements,{q:'a'}),[]);});
test('explicit false is a real boolean answer; unsupported or empty surveys cannot silently complete',()=>{assert.deepEqual(quizAnswerErrors([{name:'q',type:'boolean',title:'Agree?',isRequired:true}],{q:false}),[]);assert.ok(quizAnswerErrors([{name:'q',type:'unknown-widget',title:'Missing'}],{}).length);assert.ok(quizAnswerErrors([],{}).length);});
test('required survey evidence needs an actual answer, and false is not missing',()=>{assert.equal(hasQuizAnswer({}),false);assert.equal(hasQuizAnswer({answer:''}),false);assert.equal(hasQuizAnswer({answer:[]}),false);assert.equal(hasQuizAnswer({answer:false}),true);});
test('portable exports are only canonical authenticated API downloads, not SPA or external URLs',()=>{const path='/api/v1/exit/01234567-89ab-cdef-0123-456789abcdef/portable-record';assert.equal(portableRecordPath(path),path);assert.equal(portableRecordPath('https://evil.test'+path),null);assert.equal(portableRecordPath('/exit/01234567-89ab-cdef-0123-456789abcdef'),null);assert.equal(portableRecordPath(path+'?token=secret'),null);});
test('directory contact links select a plain authorized member identifier only',()=>{assert.equal(contactMemberFromQuery('?member=m1'),'m1');assert.equal(contactMemberFromQuery('?member=https%3A%2F%2Fevil.test'),null);});
test('friendly journey authoring validates required references and safe resource links',()=>{const steps=readJourneySteps('[{"step":1,"type":"confirmation","title":"Welcome","required":true}]');assert.deepEqual(journeyErrors(steps,readExitPackage('{"docs":[{"title":"Guide","url":"https://example.test/guide"}]}')),[]);assert.ok(journeyErrors([],{ }).length);assert.ok(journeyErrors([{step:1,type:'survey',title:'Entry',required:true}],{}).some(error=>/choose a quiz/.test(error)));assert.ok(journeyErrors(steps,{docs:[{title:'Bad',url:'javascript:alert(1)'}]}).length);});
test('matching estimates are hidden for stale, low-coverage and unavailable evidence',()=>{const result:MatchingResult={status:'promising_to_explore',fit_estimate:82,coverage:0.8,algorithm_version:'affinity-v1'};assert.equal(showFitEstimate(result),true);assert.equal(showFitEstimate({...result,stale:true}),false);assert.equal(showFitEstimate({...result,coverage:0.59}),false);assert.equal(showFitEstimate({...result,status:'outdated'}),false);assert.equal(showFitEstimate({...result,fit_estimate:null}),false);});
test('governed matching configuration requires all dimensions and versioned explicit sources',()=>{const config=emptyMatchingConfiguration();assert.ok(matchingConfigurationErrors(config).length);config.signals=['agreements','domains','purpose','practical'].map((dimension,index)=>({id:`s${index}`,dimension,label:'Can you support this?',weight:1,classification:'informational',source:{kind:index===1?'domain':'agreement',id:`source-${index}`,version:'1.0',section:'Purpose'}}));assert.deepEqual(matchingConfigurationErrors(config),[]);config.signals[1].classification='non_negotiable';assert.ok(matchingConfigurationErrors(config).some(error=>/ratified agreement/.test(error)));config.weights.agreements=0;assert.ok(matchingConfigurationErrors(config).some(error=>/100%/.test(error)));});


test('choice input round trips preserve number/string, boolean and exact-case identifiers',()=>{
 const choices=[1,'1',false,'false','A','a',{value:2,text:'Two'}];
 const options=quizChoices(choices);
 assert.equal(new Set(options.map(option=>option.key)).size,choices.length);
 for(const option of options)assert.strictEqual(quizChoiceValue(choices,quizChoiceKey(choices,option.value)),option.value);
 assert.notEqual(quizChoiceKey(choices,1),quizChoiceKey(choices,'1'));
 assert.notEqual(quizChoiceKey(choices,false),quizChoiceKey(choices,'false'));
 assert.notEqual(quizChoiceKey(choices,'A'),quizChoiceKey(choices,'a'));
 assert.equal(quizChoiceValue(choices,''),undefined);
 const questions=[{name:'q',type:'checkbox',title:'Choose',choices,correctAnswer:[1,'A']}];
 assert.deepEqual(quizQuestions(serializeQuiz(questions)),questions);
 assert.deepEqual(quizQuestionErrors(questions),[]);
 assert.ok(quizQuestionErrors([{...questions[0],correctAnswer:['missing']}]).length);
});

const branchSteps:JourneyStep[]=[
 {step:1,type:'choice',title:'Path',required:true,choices:[{value:'next',label:'Guide'},{value:'survey',label:'Survey'},{value:'done',label:'Finish'}],choice_routes:{survey:2,done:3}},
 {step:2,type:'ai_conversation',title:'Guide',required:true},
 {step:3,type:'survey',title:'Survey',required:true,quiz_id:'quiz'},
];
test('journey destinations share sequential, forward and terminal semantics with saved local navigation',()=>{
 assert.equal(journeyDestination(branchSteps,0,{choice:'next'}),1);
 assert.equal(journeyDestination(branchSteps,0,{choice:'survey'}),2);
 assert.equal(journeyDestination(branchSteps,0,{choice:'done'}),3);
 assert.equal(journeyDestination(branchSteps,2,{result_id:'proof'}),3);
 assert.equal(previousJourneyStep(branchSteps,2,{step_0:{choice:'survey'}}),0);
 assert.equal(previousJourneyStep(branchSteps,2,{step_0:{choice:'next'},step_1:{session_id:'proof'}}),1);
 for(const response of [undefined,{}, {choice:'missing'}, {choice:[]}])assert.throws(()=>journeyDestination(branchSteps,0,response));
});
test('authoring rejects backward/out-of-range/unknown choice destinations and preserves target identity on reorder',()=>{
 assert.deepEqual(journeyErrors(branchSteps,{}),[]);
 for(const choice_routes of [{survey:0},{survey:-1},{survey:4},{unknown:2}])assert.ok(journeyErrors([{...branchSteps[0],choice_routes},...branchSteps.slice(1)],{}).length);
 const reordered=reorderJourneySteps(branchSteps,[0,2,1]);
 assert.equal(reordered[0].choice_routes?.survey,1);
 assert.equal(reordered[0].choice_routes?.done,3);
 const removed=reorderJourneySteps(branchSteps,[0,1]);
 assert.ok(journeyErrors(removed,{}).length);
 const backward=reorderJourneySteps(branchSteps,[2,0,1]);
 assert.ok(journeyErrors(backward,{}).length);
});
