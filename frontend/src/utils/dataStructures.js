// Ultra-Efficient Data Structures for QuickPe
// Memory-optimized collections with O(1) operations

// Efficient LRU Cache with Map and automatic cleanup
class LRUCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.accessOrder = [];
  }

  get(key) {
    if (!this.cache.has(key)) return null;

    // Move to end (most recently used)
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);

    return this.cache.get(key);
  }

  set(key, value) {
    if (this.cache.has(key)) {
      // Update existing, move to end
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);
      this.cache.set(key, value);
      return;
    }

    // Add new entry
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used
      const lruKey = this.accessOrder.shift();
      this.cache.delete(lruKey);
    }

    this.cache.set(key, value);
    this.accessOrder.push(key);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    if (this.cache.delete(key)) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      return true;
    }
    return false;
  }

  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  size() {
    return this.cache.size;
  }
}

// Efficient Trie for fast string searches
class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.data = null; // Store associated data
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word, data = null) {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char);
    }
    node.isEndOfWord = true;
    node.data = data;
  }

  search(word) {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) {
        return null;
      }
      node = node.children.get(char);
    }
    return node.isEndOfWord ? node.data : null;
  }

  startsWith(prefix) {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children.has(char)) {
        return [];
      }
      node = node.children.get(char);
    }
    return this.collectAllWords(node, prefix);
  }

  collectAllWords(node, currentWord) {
    const results = [];

    if (node.isEndOfWord) {
      results.push({ word: currentWord, data: node.data });
    }

    for (const [char, childNode] of node.children) {
      results.push(...this.collectAllWords(childNode, currentWord + char));
    }

    return results;
  }
}

// Efficient BitSet for boolean flags
class BitSet {
  constructor(size) {
    this.size = size;
    this.bits = new Uint8Array(Math.ceil(size / 8));
  }

  set(index, value = true) {
    if (index < 0 || index >= this.size) return;

    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;

    if (value) {
      this.bits[byteIndex] |= (1 << bitIndex);
    } else {
      this.bits[byteIndex] &= ~(1 << bitIndex);
    }
  }

  get(index) {
    if (index < 0 || index >= this.size) return false;

    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;

    return (this.bits[byteIndex] & (1 << bitIndex)) !== 0;
  }

  toggle(index) {
    this.set(index, !this.get(index));
  }

  clear() {
    this.bits.fill(0);
  }

  count() {
    let count = 0;
    for (let i = 0; i < this.size; i++) {
      if (this.get(i)) count++;
    }
    return count;
  }
}

// Efficient Priority Queue using binary heap
class PriorityQueue {
  constructor(comparator = (a, b) => a - b) {
    this.heap = [];
    this.comparator = comparator;
  }

  push(item) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;

    const root = this.heap[0];
    const last = this.heap.pop();

    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }

    return root;
  }

  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.comparator(this.heap[index], this.heap[parentIndex]) >= 0) break;

      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }

  sinkDown(index) {
    const length = this.heap.length;

    while (true) {
      let left = 2 * index + 1;
      let right = 2 * index + 2;
      let smallest = index;

      if (left < length && this.comparator(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }

      if (right < length && this.comparator(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest === index) break;

      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}

// Efficient Object Pool for frequent allocations
class ObjectPool {
  constructor(createFn, resetFn = () => {}) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.maxSize = 100;
  }

  acquire() {
    if (this.pool.length > 0) {
      const obj = this.pool.pop();
      this.resetFn(obj);
      return obj;
    }
    return this.createFn();
  }

  release(obj) {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }

  size() {
    return this.pool.length;
  }

  clear() {
    this.pool.length = 0;
  }
}

// Efficient Circular Buffer for logs and recent data
class CircularBuffer {
  constructor(size) {
    this.size = size;
    this.buffer = new Array(size);
    this.start = 0;
    this.end = 0;
    this.length = 0;
  }

  push(item) {
    this.buffer[this.end] = item;
    this.end = (this.end + 1) % this.size;

    if (this.length < this.size) {
      this.length++;
    } else {
      this.start = (this.start + 1) % this.size;
    }
  }

  pop() {
    if (this.length === 0) return null;

    const item = this.buffer[this.start];
    this.start = (this.start + 1) % this.size;
    this.length--;

    return item;
  }

  peek() {
    if (this.length === 0) return null;
    return this.buffer[this.start];
  }

  toArray() {
    const result = [];
    for (let i = 0; i < this.length; i++) {
      result.push(this.buffer[(this.start + i) % this.size]);
    }
    return result;
  }

  clear() {
    this.start = 0;
    this.end = 0;
    this.length = 0;
  }
}

// Efficient Bloom Filter for fast membership testing
class BloomFilter {
  constructor(size = 10000, hashCount = 3) {
    this.size = size;
    this.hashCount = hashCount;
    this.bitArray = new Uint8Array(Math.ceil(size / 8));
  }

  add(item) {
    const hashes = this.getHashes(item);
    hashes.forEach(hash => this.setBit(hash));
  }

  contains(item) {
    const hashes = this.getHashes(item);
    return hashes.every(hash => this.getBit(hash));
  }

  getHashes(item) {
    const str = String(item);
    const hashes = [];

    // Simple hash functions for demonstration
    for (let i = 0; i < this.hashCount; i++) {
      let hash = 0;
      for (let j = 0; j < str.length; j++) {
        hash = ((hash << 5) - hash + str.charCodeAt(j)) & 0xffffffff;
      }
      hash = (hash + i * 2654435761) & 0xffffffff; // Mix with seed
      hashes.push(Math.abs(hash) % this.size);
    }

    return hashes;
  }

  setBit(index) {
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    this.bitArray[byteIndex] |= (1 << bitIndex);
  }

  getBit(index) {
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    return (this.bitArray[byteIndex] & (1 << bitIndex)) !== 0;
  }
}

// Export all data structures
export {
  LRUCache,
  Trie,
  BitSet,
  PriorityQueue,
  ObjectPool,
  CircularBuffer,
  BloomFilter
};

// QuickPe-specific optimized data structures
export class TransactionStore {
  constructor() {
    this.transactions = new Map();
    this.sortedIds = [];
    this.filterCache = new Map();
    this.searchTrie = new Trie();
  }

  add(transaction) {
    this.transactions.set(transaction._id, transaction);

    // Maintain sorted order (newest first)
    this.sortedIds = Array.from(this.transactions.keys()).sort((a, b) => {
      const t1 = this.transactions.get(a);
      const t2 = this.transactions.get(b);
      return new Date(t2.timestamp || t2.createdAt) - new Date(t1.timestamp || t1.createdAt);
    });

    // Update search index
    this.updateSearchIndex(transaction);

    // Clear filter cache
    this.filterCache.clear();
  }

  updateSearchIndex(transaction) {
    const searchTerms = [
      transaction.transactionId,
      transaction.description,
      transaction.otherUser?.name,
      transaction.otherUser?.quickpeId
    ].filter(Boolean);

    searchTerms.forEach(term => {
      this.searchTrie.insert(term, transaction._id);
    });
  }

  getFiltered(searchTerm = '', typeFilter = 'all', dateFilter = 'all') {
    const cacheKey = `${searchTerm}_${typeFilter}_${dateFilter}`;

    if (this.filterCache.has(cacheKey)) {
      return this.filterCache.get(cacheKey);
    }

    let filtered = this.sortedIds.map(id => this.transactions.get(id));

    // Apply search filter
    if (searchTerm) {
      const searchResults = this.searchTrie.startsWith(searchTerm);
      const matchingIds = new Set(searchResults.map(r => r.data));
      filtered = filtered.filter(t => matchingIds.has(t._id));
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      const targetType = typeFilter === 'received' ? 'credit' : 'debit';
      filtered = filtered.filter(t => t.type === targetType);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let cutoffDate;

      switch (dateFilter) {
        case 'today':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'last3':
          cutoffDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
          break;
        case 'last30':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = null;
      }

      if (cutoffDate) {
        filtered = filtered.filter(t =>
          new Date(t.timestamp || t.createdAt) >= cutoffDate
        );
      }
    }

    // Cache result
    this.filterCache.set(cacheKey, filtered);
    return filtered;
  }

  getById(id) {
    return this.transactions.get(id);
  }

  clear() {
    this.transactions.clear();
    this.sortedIds = [];
    this.filterCache.clear();
    this.searchTrie = new Trie();
  }
}

export class UserStore {
  constructor() {
    this.users = new Map();
    this.emailIndex = new Map();
    this.quickpeIdIndex = new Map();
    this.searchTrie = new Trie();
  }

  add(user) {
    this.users.set(user._id, user);
    this.emailIndex.set(user.email.toLowerCase(), user._id);
    this.quickpeIdIndex.set(user.quickpeId, user._id);

    // Update search index
    const searchTerms = [
      user.firstName,
      user.lastName,
      user.email,
      user.quickpeId
    ].filter(Boolean);

    searchTerms.forEach(term => {
      this.searchTrie.insert(term, user._id);
    });
  }

  getById(id) {
    return this.users.get(id);
  }

  getByEmail(email) {
    const id = this.emailIndex.get(email.toLowerCase());
    return id ? this.users.get(id) : null;
  }

  getByQuickPeId(quickpeId) {
    const id = this.quickpeIdIndex.get(quickpeId);
    return id ? this.users.get(id) : null;
  }

  search(query) {
    const results = this.searchTrie.startsWith(query);
    return results.map(r => this.users.get(r.data)).filter(Boolean);
  }

  getAll() {
    return Array.from(this.users.values());
  }

  clear() {
    this.users.clear();
    this.emailIndex.clear();
    this.quickpeIdIndex.clear();
    this.searchTrie = new Trie();
  }
}
