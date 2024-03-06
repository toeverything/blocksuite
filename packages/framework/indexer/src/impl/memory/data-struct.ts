import type {
  Collector,
  CollectorOutput,
  Document,
  Query,
  Schema,
} from '../../index.js';
import {
  DateInvertedIndex,
  FullTextInvertedIndex,
  IntegerInvertedIndex,
  type InvertedIndex,
  StringInvertedIndex,
} from './inverted-index.js';
import { Weight } from './weight.js';

type DataRecord = {
  id: string;
  data: Map<string, unknown[]>;
  deleted: boolean;
};

export class DataStruct {
  records: DataRecord[] = [];

  idMap = new Map<string, number>();

  invertedIndex = new Map<string, InvertedIndex<unknown>>();

  constructor(private readonly schema: Schema) {
    for (const field of schema.fields) {
      if (field.type === 'String') {
        this.invertedIndex.set(field.key, new StringInvertedIndex());
      } else if (field.type === 'Integer') {
        this.invertedIndex.set(field.key, new IntegerInvertedIndex());
      } else if (field.type === 'FullText') {
        this.invertedIndex.set(field.key, new FullTextInvertedIndex());
      } else if (field.type === 'Date') {
        this.invertedIndex.set(field.key, new DateInvertedIndex());
      } else {
        throw new Error(`Field type '${field.type}' not supported`);
      }
    }
  }

  insert(document: Document) {
    if (this.idMap.has(document.id)) {
      throw new Error('Document already exists');
    }

    this.records.push({
      id: document.id,
      data: document.fields,
      deleted: false,
    });

    const nid = this.records.length - 1;
    this.idMap.set(document.id, nid);
    for (const [key, values] of document.fields) {
      for (const value of values) {
        const iidx = this.invertedIndex.get(key);
        if (!iidx) {
          throw new Error(
            `Inverted index '${key}' not found, document not match schema`
          );
        }
        iidx.insert(nid, value);
      }
    }
  }

  delete(id: string) {
    const nid = this.idMap.get(id);
    if (nid === undefined) {
      throw new Error('Document not found');
    }

    this.records[nid].deleted = true;
    this.records[nid].data = new Map();
  }

  weightAll(): Weight {
    const weight = new Weight();
    for (let i = 0; i < this.records.length; i++) {
      weight.addScore(i, 1);
    }
    return weight;
  }

  private queryRaw(query: Query): Weight {
    if (query.type === 'match') {
      const iidx = this.invertedIndex.get(query.field);
      if (!iidx) {
        throw new Error(`Field '${query.field}' not found`);
      }
      return iidx.match(query.match);
    } else if (query.type === 'boolean') {
      const weights = query.queries.map(q => this.queryRaw(q));
      if (query.occur === 'must') {
        return weights.reduce((acc, w) => acc.and(w));
      } else if (query.occur === 'must_not') {
        const total = weights.reduce((acc, w) => acc.and(w));
        return this.weightAll().exclude(total);
      } else if (query.occur === 'should') {
        return weights.reduce((acc, w) => acc.or(w));
      }
    } else if (query.type === 'all') {
      return this.weightAll();
    }
    throw new Error(`Query type '${query.type}' not supported`);
  }

  query(query: Query): Weight {
    return this.queryRaw(query).filter(id => !this.records[id].deleted);
  }

  collect<C extends Collector>(
    weight: Weight,
    collector: C
  ): CollectorOutput<C> {
    const collectorType = collector.type;
    if (collectorType === 'Count') {
      return weight.scores.size;
    } else if (collectorType === 'TopDocs') {
      return weight
        .toArray()
        .slice(collector.skip, collector.limit)
        .map(id => this.records[id].id);
    } else if (collectorType === 'TermsAggregation') {
      return this.termsAggregation(collector.field, weight);
    } else if (collectorType === 'Highlight') {
      const nids = weight
        .toArray()
        .slice(collector.topDocs.skip, collector.topDocs.limit);
      const iidx = this.invertedIndex.get(collector.field);
      if (!iidx) {
        throw new Error(`Field '${collector.field}' not found`);
      }
      return nids.map(id =>
        iidx.highlight(id, collector.before, collector.end)
      );
    } else if (collectorType === 'DocValue') {
      const nids = weight
        .toArray()
        .slice(collector.topDocs.skip, collector.topDocs.limit);
      return nids.map(id => this.records[id].data.get(collector.field) ?? []);
    } else {
      throw new Error(`Collector type '${collectorType}' not supported`);
    }
  }

  termsAggregation(field: string, weight: Weight) {
    const aggregation: Record<string, number> = {};

    for (const id of weight.scores.keys()) {
      for (const value of this.records[id].data.get(field) ?? []) {
        const valueString = this.fieldValueToString(field, value);
        const count = aggregation[valueString] ?? 0;
        aggregation[valueString] = count + 1;
      }
    }

    return aggregation;
  }

  fieldValueToString(field: string, value: unknown): string {
    const type = this.schema.fields.find(f => f.key === field)?.type;

    if (!type) {
      throw new Error(`Field '${type}' not found.`);
    }

    if (type === 'FullText') {
      return value as string;
    } else if (type === 'Integer') {
      return (value as number).toString();
    } else if (type === 'String') {
      return value as string;
    } else {
      throw new Error(`Field Type '${type}' not supported.`);
    }
  }

  has(id: string): boolean {
    return this.idMap.has(id);
  }
}
