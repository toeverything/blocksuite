import type { FnTypeInstance } from './composite-type.js';
import type { TypeInstance, Unify } from './type.js';

import { tv, type TypeVarContext, type TypeVarReferenceInstance } from './type-variable.js';


export class NewTypeSystem {
  //TODO support function type
  convertMap = new Map<string, Map<string, {
    from: TypeInstance,
    to: TypeInstance,
    convertValue: (value: unknown) => unknown
  }>>();

  unify: Unify = (ctx, left, right, covariance: boolean = true): boolean => {
    if (left == null) return true;
    if (right == null) return false;
    if (tv.typeVarReference.is(left)) {
      return this.unifyReference(ctx, left, right, covariance);
    }
    if (tv.typeVarReference.is(right)) {
      return this.unifyReference(ctx, right, left, !covariance);
    }
    return this.unifyNormalType(ctx, left, right, covariance);
  };

  private unifyNormalType(ctx: TypeVarContext, left: TypeInstance | undefined, right: TypeInstance | undefined, covariance: boolean): boolean {
    if (!left || !right) {
      return false;
    }
    if (left.name !== right.name) {
      [left, right] = covariance ? [left, right] : [right, left];
      const convertConfig = this.convertMap.get(left.name)?.get(right.name);
      if (convertConfig == null) {
        return false;
      }
      left = convertConfig.to;
    }
    return left.unify(ctx, right, this.unify);
  }

  instanceFn(
    template: FnTypeInstance,
    realArgs: TypeInstance[],
    realRt: TypeInstance,
    ctx: TypeVarContext,
  ): FnTypeInstance | void {
    const newCtx = { ...ctx };
    for (let i = 0; i < template.args.length; i++) {
      const arg = template.args[i];
      const realArg = realArgs[i];
      if (arg == null) {
        return;
      }
      if (realArg != null) {
        if (!this.unify(newCtx, realArg, arg)) {
          return;
        }
      }
    }
    this.unify(newCtx, template.rt, realRt);
    return template.subst(newCtx);
  }

  unifyReference(ctx: TypeVarContext, left: TypeVarReferenceInstance, right: TypeInstance | undefined, covariance: boolean): boolean {
    if (!right) {
      return false;
    }
    let leftDefine = ctx[left.name];
    if (!leftDefine) {
      ctx[left.name] = leftDefine = {
        define: tv.typeVarDefine.create(left.name),
      };
    }
    const leftType = leftDefine.type;
    if (tv.typeVarReference.is(right)) {
      return this.unifyReference(ctx, right, leftType, !covariance);
    }
    return this.unifyNormalType(ctx, leftType, right, covariance);
  }

  public subst(fromEntries: {[p: string]: any}, fnTypeInstance: FnTypeInstance<(DTInstance<"Date", number, ZodNumber> | ArrayTypeInstance<TypeVarReferenceInstance<"option">> | DTInstance<"Number", number, ZodNumber> | DTInstance<"String", string, ZodString> | TypeVarReferenceInstance<"options"> | ArrayTypeInstance<TypeVarReferenceInstance<"options">> | DTInstance<"Boolean", boolean, ZodBoolean> | DTInstance<"Number", never, ZodUnknown>)[], DTInstance<"Boolean", boolean, ZodBoolean>>) {
    
  }
}

export const newTypeSystem = new NewTypeSystem();
