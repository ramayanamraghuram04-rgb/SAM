import assert from 'node:assert';
import { fuzzyMatchVerificationCode } from './src/services/aiVerificationService.ts';

console.log('====================================================');
console.log('SAM AI Notebook Code Verification Test Suite');
console.log('====================================================');

// Test 1: Exact match in text
{
  const text = 'Assignment 2\nStudent: Raghu\nVerification Code: 9BQHPY\nQuestion 1...';
  const result = fuzzyMatchVerificationCode(text, '9BQHPY');
  assert.strictEqual(result.isMatch, true, 'Exact match should be found');
  assert.strictEqual(result.confidence >= 95, true, 'Exact match should have >= 95% confidence');
  console.log('[PASS] 1. Exact match correctly identified with high confidence');
}

// Test 2: Match with whitespace inserted by OCR in handwriting
{
  const text = 'Notebook Page 1\nCode: 9 B Q H P Y\nAnswers to questions...';
  const result = fuzzyMatchVerificationCode(text, '9BQHPY');
  assert.strictEqual(result.isMatch, true, 'Match with spaces should be found');
  console.log('[PASS] 2. Match with OCR spaces between characters correctly recognized');
}

// Test 3: Common handwriting OCR confusion (B -> 8, O -> 0, etc.)
{
  // Code is '9BQHPY', OCR read 'B' as '8' -> '98QHPY'
  const text = 'Student work\nCode on paper: 98QHPY\nSolution: x = 5';
  const result = fuzzyMatchVerificationCode(text, '9BQHPY');
  assert.strictEqual(result.isMatch, true, 'Fuzzy match with B->8 handwriting substitution should be recognized');
  assert.strictEqual(result.confidence >= 80, true, 'Confidence should be >= 80%');
  assert.strictEqual(result.isFuzzy, true, 'Should be flagged as fuzzy match');
  console.log('[PASS] 3. Handwriting character substitution (8 vs B) correctly matched');
}

// Test 4: Another handwriting substitution (O vs 0, S vs 5)
{
  // Target: 'A5K0Z9'
  // OCR: 'A S K O Z 9'
  const text = 'TOP OF PAGE: A S K O Z 9';
  const result = fuzzyMatchVerificationCode(text, 'A5K0Z9');
  assert.strictEqual(result.isMatch, true, 'S->5 and O->0 substitutions should be recognized');
  console.log('[PASS] 4. Multi-character handwriting substitution (S->5, O->0) correctly matched');
}

// Test 5: Completely different text (no match)
{
  const text = 'Random lecture notes without any code\nMath formula: E = mc^2';
  const result = fuzzyMatchVerificationCode(text, '9BQHPY');
  assert.strictEqual(result.isMatch, false, 'Irrelevant text should not match');
  console.log('[PASS] 5. Negative case correctly rejected');
}

// Test 6: Empty inputs handling
{
  const result1 = fuzzyMatchVerificationCode('', '9BQHPY');
  assert.strictEqual(result1.isMatch, false);
  const result2 = fuzzyMatchVerificationCode('Text here', '');
  assert.strictEqual(result2.isMatch, false);
  console.log('[PASS] 6. Empty input edge cases handled gracefully');
}

console.log('----------------------------------------------------');
console.log('All AI Verification unit tests passed successfully!');
console.log('====================================================');
