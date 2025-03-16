import { describe, expect, test } from 'vitest';

import {
  CircularDependencyError,
  Container,
  createIdentifier,
  createScope,
  DuplicateServiceDefinitionError,
  MissingDependencyError,
  RecursionLimitError,
  ServiceNotFoundError,
  ServiceProvider,
} from '../di/index.js';

describe('di', () => {
  test('basic', () => {
    const container = new Container();
    class TestService {
      a = 'b';
    }

    container.add(TestService);

    const provider = container.provider();
    expect(provider.get(TestService)).toEqual({ a: 'b' });
  });

  test('size', () => {
    const container = new Container();
    class TestService {
      a = 'b';
    }

    container.add(TestService);

    expect(container.size).toEqual(1);
  });

  test('dependency', () => {
    const container = new Container();

    class A {
      value = 'hello world';
    }

    class B {
      constructor(public a: A) {}
    }

    class C {
      constructor(public b: B) {}
    }

    container.add(A).add(B, [A]).add(C, [B]);

    const provider = container.provider();

    expect(provider.get(C).b.a.value).toEqual('hello world');
  });

  test('identifier', () => {
    interface Animal {
      name: string;
    }
    const Animal = createIdentifier<Animal>('Animal');

    class Cat {
      name = 'cat';

      constructor() {}
    }

    class Zoo {
      constructor(public animal: Animal) {}
    }

    const container = new Container();
    container.addImpl(Animal, Cat).add(Zoo, [Animal]);

    const provider = container.provider();
    expect(provider.get(Zoo).animal.name).toEqual('cat');
  });

  test('variant', () => {
    const container = new Container();

    interface USB {
      speed: number;
    }

    const USB = createIdentifier<USB>('USB');

    class TypeA implements USB {
      speed = 100;
    }
    class TypeC implements USB {
      speed = 300;
    }

    class PC {
      constructor(
        public typeA: USB,
        public ports: USB[]
      ) {}
    }

    container
      .addImpl(USB('A'), TypeA)
      .addImpl(USB('C'), TypeC)
      .add(PC, [USB('A'), [USB]]);

    const provider = container.provider();
    expect(provider.get(USB('A')).speed).toEqual(100);
    expect(provider.get(USB('C')).speed).toEqual(300);
    expect(provider.get(PC).typeA.speed).toEqual(100);
    expect(provider.get(PC).ports.length).toEqual(2);
  });

  test('lazy initialization', () => {
    const container = new Container();
    interface Command {
      shortcut: string;
      callback: () => void;
    }
    const Command = createIdentifier<Command>('command');

    let pageSystemInitialized = false;

    class PageSystem {
      mode = 'page';

      name = 'helloworld';

      constructor() {
        pageSystemInitialized = true;
      }

      rename() {
        this.name = 'foobar';
      }

      switchToEdgeless() {
        this.mode = 'edgeless';
      }
    }

    class CommandSystem {
      constructor(public commands: Command[]) {}

      execute(shortcut: string) {
        const command = this.commands.find(c => c.shortcut === shortcut);
        if (command) {
          command.callback();
        }
      }
    }

    container.add(PageSystem);
    container.add(CommandSystem, [[Command]]);
    container.addImpl(Command('switch'), p => ({
      shortcut: 'option+s',
      callback: () => p.get(PageSystem).switchToEdgeless(),
    }));
    container.addImpl(Command('rename'), p => ({
      shortcut: 'f2',
      callback: () => p.get(PageSystem).rename(),
    }));

    const provider = container.provider();
    const commandSystem = provider.get(CommandSystem);

    expect(
      pageSystemInitialized,
      "PageSystem won't be initialized until command executed"
    ).toEqual(false);

    commandSystem.execute('option+s');
    expect(pageSystemInitialized).toEqual(true);
    expect(provider.get(PageSystem).mode).toEqual('edgeless');

    expect(provider.get(PageSystem).name).toEqual('helloworld');
    expect(commandSystem.commands.length).toEqual(2);
    commandSystem.execute('f2');
    expect(provider.get(PageSystem).name).toEqual('foobar');
  });

  test('duplicate, override', () => {
    const container = new Container();

    const something = createIdentifier<any>('USB');

    class A {
      a = 'i am A';
    }

    class B {
      b = 'i am B';
    }

    container.addImpl(something, A).override(something, B);

    const provider = container.provider();
    expect(provider.get(something)).toEqual({ b: 'i am B' });
  });

  test('scope', () => {
    const container = new Container();

    const workspaceScope = createScope('workspace');
    const pageScope = createScope('page', workspaceScope);
    const editorScope = createScope('editor', pageScope);

    class System {
      appName = 'affine';
    }

    container.add(System);

    class Workspace {
      name = 'workspace';

      constructor(public system: System) {}
    }

    container.scope(workspaceScope).add(Workspace, [System]);
    class Page {
      name = 'page';

      constructor(
        public system: System,
        public workspace: Workspace
      ) {}
    }

    container.scope(pageScope).add(Page, [System, Workspace]);

    class Editor {
      name = 'editor';

      constructor(public page: Page) {}
    }

    container.scope(editorScope).add(Editor, [Page]);

    const root = container.provider();
    expect(root.get(System).appName).toEqual('affine');
    expect(() => root.get(Workspace)).toThrowError(ServiceNotFoundError);

    const workspace = container.provider(workspaceScope, root);
    expect(workspace.get(Workspace).name).toEqual('workspace');
    expect(workspace.get(System).appName).toEqual('affine');
    expect(() => root.get(Page)).toThrowError(ServiceNotFoundError);

    const page = container.provider(pageScope, workspace);
    expect(page.get(Page).name).toEqual('page');
    expect(page.get(Workspace).name).toEqual('workspace');
    expect(page.get(System).appName).toEqual('affine');

    const editor = container.provider(editorScope, page);
    expect(editor.get(Editor).name).toEqual('editor');
  });

  test('service not found', () => {
    const container = new Container();

    const provider = container.provider();
    expect(() => provider.get(createIdentifier('SomeService'))).toThrowError(
      ServiceNotFoundError
    );
  });

  test('missing dependency', () => {
    const container = new Container();

    class A {
      value = 'hello world';
    }

    class B {
      constructor(public a: A) {}
    }

    container.add(B, [A]);

    const provider = container.provider();
    expect(() => provider.get(B)).toThrowError(MissingDependencyError);
  });

  test('circular dependency', () => {
    const container = new Container();

    class A {
      constructor(public c: C) {}
    }

    class B {
      constructor(public a: A) {}
    }

    class C {
      constructor(public b: B) {}
    }

    container.add(A, [C]).add(B, [A]).add(C, [B]);

    const provider = container.provider();
    expect(() => provider.get(A)).toThrowError(CircularDependencyError);
    expect(() => provider.get(B)).toThrowError(CircularDependencyError);
    expect(() => provider.get(C)).toThrowError(CircularDependencyError);
  });

  test('duplicate service definition', () => {
    const container = new Container();

    class A {}

    container.add(A);
    expect(() => container.add(A)).toThrowError(
      DuplicateServiceDefinitionError
    );

    class B {}
    const Something = createIdentifier('something');
    container.addImpl(Something, A);
    expect(() => container.addImpl(Something, B)).toThrowError(
      DuplicateServiceDefinitionError
    );
  });

  test('recursion limit', () => {
    // maxmium resolve depth is 100
    const container = new Container();
    const Something = createIdentifier('something');
    let i = 0;
    for (; i < 100; i++) {
      const next = i + 1;

      class Test {
        constructor(_next: any) {}
      }

      container.addImpl(Something(i.toString()), Test, [
        Something(next.toString()),
      ]);
    }

    class Final {
      a = 'b';
    }
    container.addImpl(Something(i.toString()), Final);
    const provider = container.provider();
    expect(() => provider.get(Something('0'))).toThrowError(
      RecursionLimitError
    );
  });

  test('self resolve', () => {
    const container = new Container();
    const provider = container.provider();
    expect(provider.get(ServiceProvider)).toEqual(provider);
  });
});
