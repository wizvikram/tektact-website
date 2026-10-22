'use strict';
const assert=require('node:assert/strict');
const C=require('./core.js');
const example=[
 ['Exterior',3370,22,74140],['Interior',6921,19,131499],['Enamel',975,25,24375],
 ['Wood',793,70,55510],['Texture',401,110,44110],['Tile guard',65,30,1950],['Waterproofing',1400,33,46200]
];
const items=example.map(([title,qty,rate])=>({title,qty:String(qty),rate:String(rate)}));
const q=C.calculateQuote(items);
assert.deepEqual(q.errors,[]);
assert.deepEqual(q.lineAmounts,example.map(row=>BigInt(row[3])*100n));
assert.equal(q.grandTotal,37778400n);
assert.equal(C.amountInWords(q.grandTotal),'Rupees Three Lakh Seventy Seven Thousand Seven Hundred Eighty Four Only');
assert.equal(C.formatRupees(q.grandTotal),'₹3,77,784');
assert.equal(C.calculateLine({qty:'3.333',rate:'1.50'}),500n);
assert.equal(C.calculateLine({qty:'0.001',rate:'5.00'}),1n);
assert.equal(C.calculateQuote([{title:'Paint',qty:'100',rate:'20'}],{mode:'percent',value:'10'},'18').grandTotal,212400n);
assert.equal(C.calculateQuote([{title:'Paint',qty:'100',rate:'20'}],{mode:'amount',value:'200'},'18').grandTotal,212400n);
assert.equal(C.calculateQuote([{title:'Paint',qty:'0',rate:'20'}]).grandTotal,0n);
assert.equal(C.rectangleArea({length:'12',width:'10',count:'2',deduction:'40'}),200);
assert.throws(()=>C.rectangleArea({length:12,width:10,count:1,deduction:121}),/Deduction/);
assert.throws(()=>C.calculateLine({qty:'-1',rate:'20'}),/non-negative/);
assert.throws(()=>C.calculateLine({qty:'1.0001',rate:'20'}),/decimal places/);
assert.throws(()=>C.calculateLine({qty:'1',rate:'0.001'}),/decimal places/);
assert.ok(C.calculateQuote([{title:'x',qty:'10',rate:'10'}],{mode:'amount',value:'200'},'0').errors.length);
assert.ok(C.calculateQuote([{title:'',qty:'10',rate:'10'}]).errors.length);
assert.equal(C.amountInWords(100010005n),'Rupees Ten Lakh One Hundred and Five Paise Only');
assert.equal(C.amountInWords(0n),'Rupees Zero Only');
assert.equal(C.amountInWords(10000000000000n),'Rupees One Kharab Only');
assert.equal(C.amountInWords(9000000000000000n),'Rupees Nine Hundred Kharab Only');
assert.equal(C.safeText('<script>alert("x")</script>'),'&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
console.log('PASS: 22 core assertions + full 7-line sample regression.');
