import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentOrientationHistory, orientationChatScope, orientationReplyCount, orientationSession, type OrientationHistory, type OrientationSelection } from './orientation-chat-state';
import { readSupportNavigation, supportNavigationKey } from './support-navigation';
import { quizAnswerText } from './quiz-answer';

const scope=orientationChatScope('owner-a','journey-a','step_1');
const selection:OrientationSelection={scope,mode:'resume',id:null};
const history:OrientationHistory={id:'session-a',journey_id:'journey-a',step_id:'step_1',turn_count:2,stale:false,messages:[{role:'user',content:'How do we care for tools?'},{role:'assistant',content:'Read the shared-care agreement.'},{role:'user',content:'Can you consent for me?'},{role:'assistant',content:'You must make that decision yourself.'}]};

test('reload resumes the current owner and step with real saved replies',()=>{
  const session=orientationSession(selection,scope,'session-a');
  assert.equal(session,'session-a');
  assert.equal(currentOrientationHistory(history,session,'journey-a','step_1'),true);
  assert.equal(orientationReplyCount(history),2);
});

test('explicit new stays new through availability refetch; choosing history restores only that selection',()=>{
  const fresh:OrientationSelection={scope,mode:'new',id:null};
  assert.equal(orientationSession(fresh,scope,'session-a'),null);
  assert.equal(orientationSession(fresh,scope,'session-b'),null);
  assert.equal(orientationSession({...fresh,mode:'selected',id:'session-a'},scope,'session-b'),'session-a');
});

test('owner, journey and required-step changes cannot reuse a selected transcript',()=>{
  const chosen:OrientationSelection={scope,mode:'selected',id:'session-a'};
  for(const next of [orientationChatScope('owner-b','journey-a','step_1'),orientationChatScope('owner-a','journey-b','step_1'),orientationChatScope('owner-a','journey-a','step_2')])assert.equal(orientationSession(chosen,next,null),null);
  assert.equal(currentOrientationHistory(history,'session-a','journey-b','step_1'),false);
  assert.equal(currentOrientationHistory(history,'session-a','journey-a','step_2'),false);
  assert.equal(currentOrientationHistory(history,'session-b','journey-a','step_1'),false);
  assert.equal(currentOrientationHistory({...history,step_id:null},'session-a','journey-a','step_1'),false);
});

test('stale content and incomplete or overstated history cannot create completion evidence',()=>{
  assert.equal(orientationReplyCount({...history,stale:true}),0);
  assert.equal(orientationReplyCount({...history,turn_count:20}),2);
  assert.equal(orientationReplyCount({...history,turn_count:1}),1);
  assert.equal(orientationReplyCount({...history,messages:[{role:'assistant',content:'   '},{role:'system',content:'A reply is required.'}]}),0);
});

test('support audit return storage is owner and task scoped and contains no inspection or command state',()=>{
  const navigation={organization:'01234567-89ab-cdef-0123-456789abcdef',kind:'journey_maps',search:'Shared care',page:2,advanced:false,tab:'resources'};
  assert.deepEqual(readSupportNavigation(JSON.stringify(navigation)),navigation);
  assert.notEqual(supportNavigationKey('owner-a','/admin/learning'),supportNavigationKey('owner-b','/admin/learning'));
  assert.notEqual(supportNavigationKey('owner-a','/admin/learning'),supportNavigationKey('owner-a','/admin/users'));
  assert.equal(supportNavigationKey('owner-a','/admin?resource=users&record=secret'),null);
  assert.equal(readSupportNavigation(JSON.stringify({...navigation,action:'update'})),null);
  assert.equal(readSupportNavigation(JSON.stringify({...navigation,inspected:{body:'private'}})),null);
  assert.equal(readSupportNavigation(JSON.stringify({...navigation,reason:'Technical support'})),null);
});

test('answer summaries preserve explicit No and distinguish boolean answers from text choice values',()=>{
  assert.equal(quizAnswerText(false),'No');
  assert.equal(quizAnswerText(true),'Yes');
  assert.equal(quizAnswerText(false,[{value:false,text:'Not ready yet'},{value:'false',text:'Literal false'}]),'Not ready yet');
  assert.equal(quizAnswerText('false',[{value:false,text:'Not ready yet'},{value:'false',text:'Literal false'}]),'Literal false');
});
