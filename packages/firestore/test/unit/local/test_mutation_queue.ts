/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Timestamp } from '../../../src/api/timestamp';
import { Query } from '../../../src/core/query';
import { BatchId, ProtoByteString } from '../../../src/core/types';
import { GarbageCollector } from '../../../src/local/garbage_collector';
import { MutationQueue } from '../../../src/local/mutation_queue';
import { Persistence } from '../../../src/local/persistence';
import { DocumentKeySet } from '../../../src/model/collections';
import { DocumentKey } from '../../../src/model/document_key';
import { Mutation } from '../../../src/model/mutation';
import { MutationBatch } from '../../../src/model/mutation_batch';
import { AnyDuringMigration } from '../../../src/util/misc';

/**
 * A wrapper around a MutationQueue that automatically creates a
 * transaction around every operation to reduce test boilerplate.
 */
export class TestMutationQueue {
  constructor(public persistence: Persistence, public queue: MutationQueue) {}

  start(): Promise<void> {
    return this.persistence.runTransaction('start', false, txn => {
      return this.queue.start(txn);
    });
  }

  checkEmpty(): Promise<boolean> {
    return this.persistence.runTransaction('checkEmpty', false, txn => {
      return this.queue.checkEmpty(txn);
    });
  }

  countBatches(): Promise<number> {
    return this.persistence
      .runTransaction('countBatches', false, txn => {
        return this.queue.getAllMutationBatches(txn);
      })
      .then(batches => batches.length);
  }

  getHighestAcknowledgedBatchId(): Promise<BatchId> {
    return this.persistence.runTransaction(
      'getHighestAcknowledgedBatchId',
      false,
      txn => {
        return this.queue.getHighestAcknowledgedBatchId(txn);
      }
    );
  }

  acknowledgeBatch(
    batch: MutationBatch,
    streamToken: ProtoByteString
  ): Promise<void> {
    return this.persistence.runTransaction(
      'acknowledgeThroughBatchId',
      true,
      txn => {
        return this.queue.acknowledgeBatch(txn, batch, streamToken);
      }
    );
  }

  getLastStreamToken(): Promise<string> {
    return this.persistence.runTransaction('getLastStreamToken', false, txn => {
      return this.queue.getLastStreamToken(txn);
    }) as AnyDuringMigration;
  }

  setLastStreamToken(streamToken: string): Promise<void> {
    return this.persistence.runTransaction('setLastStreamToken', true, txn => {
      return this.queue.setLastStreamToken(txn, streamToken);
    });
  }

  addMutationBatch(mutations: Mutation[]): Promise<MutationBatch> {
    return this.persistence.runTransaction('addMutationBatch', false, txn => {
      return this.queue.addMutationBatch(txn, Timestamp.now(), mutations);
    });
  }

  lookupMutationBatch(batchId: BatchId): Promise<MutationBatch | null> {
    return this.persistence.runTransaction(
      'lookupMutationBatch',
      false,
      txn => {
        return this.queue.lookupMutationBatch(txn, batchId);
      }
    );
  }

  getNextMutationBatchAfterBatchId(
    batchId: BatchId
  ): Promise<MutationBatch | null> {
    return this.persistence.runTransaction(
      'getNextMutationBatchAfterBatchId',
      false,
      txn => {
        return this.queue.getNextMutationBatchAfterBatchId(txn, batchId);
      }
    );
  }

  getAllMutationBatches(): Promise<MutationBatch[]> {
    return this.persistence.runTransaction(
      'getAllMutationBatches',
      false,
      txn => {
        return this.queue.getAllMutationBatches(txn);
      }
    );
  }

  getAllMutationBatchesThroughBatchId(
    batchId: BatchId
  ): Promise<MutationBatch[]> {
    return this.persistence.runTransaction(
      'getAllMutationBatchesThroughBatchId',
      false,
      txn => {
        return this.queue.getAllMutationBatchesThroughBatchId(txn, batchId);
      }
    );
  }

  getAllMutationBatchesAffectingDocumentKey(
    documentKey: DocumentKey
  ): Promise<MutationBatch[]> {
    return this.persistence.runTransaction(
      'getAllMutationBatchesAffectingDocumentKey',
      false,
      txn => {
        return this.queue.getAllMutationBatchesAffectingDocumentKey(
          txn,
          documentKey
        );
      }
    );
  }

  getAllMutationBatchesAffectingDocumentKeys(
    documentKeys: DocumentKeySet
  ): Promise<MutationBatch[]> {
    return this.persistence.runTransaction(
      'getAllMutationBatchesAffectingDocumentKeys',
      false,
      txn => {
        return this.queue.getAllMutationBatchesAffectingDocumentKeys(
          txn,
          documentKeys
        );
      }
    );
  }

  getAllMutationBatchesAffectingQuery(query: Query): Promise<MutationBatch[]> {
    return this.persistence.runTransaction(
      'getAllMutationBatchesAffectingQuery',
      false,
      txn => {
        return this.queue.getAllMutationBatchesAffectingQuery(txn, query);
      }
    );
  }

  removeMutationBatch(batch: MutationBatch): Promise<void> {
    return this.persistence.runTransaction('removeMutationBatch', true, txn => {
      return this.queue.removeMutationBatch(txn, batch);
    });
  }

  collectGarbage(gc: GarbageCollector): Promise<DocumentKeySet> {
    return this.persistence.runTransaction('garbageCollection', true, txn => {
      return gc.collectGarbage(txn);
    });
  }
}
