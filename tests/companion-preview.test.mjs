import { test } from 'node:test';
import assert from 'node:assert/strict';
import { companionPreviewConnection, previewRequestAllowed } from '../scripts/companion/preview-connection.mjs';

const req = (headers={}, remote='127.0.0.1', method='POST') => ({
  socket:{remoteAddress:remote},method,
  headers:{host:'127.0.0.1:5184',origin:'http://127.0.0.1:5184','content-type':'application/json',...headers},
});
test('companion preview validates the caller before forwarding',()=>{
  assert.equal(previewRequestAllowed(req(),5184),true);
  assert.equal(previewRequestAllowed(req({origin:'https://other.example'}),5184),false);
  assert.equal(previewRequestAllowed(req({},'192.168.1.2'),5184),false);
  assert.equal(previewRequestAllowed(req({host:'other.example:5184'}),5184),false);
  assert.equal(previewRequestAllowed(req({origin:undefined}),5184),false);
  assert.equal(previewRequestAllowed(req({'sec-fetch-site':'cross-site'}),5184),false);
  assert.equal(previewRequestAllowed(req({'content-type':'text/plain'}),5184),false);
  assert.equal(previewRequestAllowed(req({origin:undefined},'127.0.0.1','GET'),5184),true);
});
test('companion preview cannot forward to an external destination',()=>{
  for(const address of ['https://127.0.0.1:5181/','http://other.example:5181/','http://127.0.0.1:5181/api','http://user:secret@127.0.0.1:5181/'])
    assert.throws(()=>companionPreviewConnection(address),/loopback/);
  assert.equal(companionPreviewConnection('http://127.0.0.1:5181/').apply,'serve');
});
