import { customElement, property, query, state } from 'lit/decorators.js';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { createEvent } from '../../__internal__/index.js';
import style from './style.css';

// TODO extract to a common list component
@customElement('lang-list')
export class LangList extends LitElement {
  static get styles() {
    return css`
      ${unsafeCSS(style)}
    `;
  }

  @state()
  filterText = '';

  @property({ type: String })
  selectedLanguage = '';

  @property()
  showLangList = 'hidden';

  @query('#filter-input')
  filterInput!: HTMLInputElement;

  @state()
  disposeTimer = 0;

  @property()
  delay = 150;

  static languages = [
    '1c',
    'abnf',
    'accesslog',
    'actionscript',
    'ada',
    'angelscript',
    'apache',
    'applescript',
    'arcade',
    'arduino',
    'armasm',
    'xml',
    'asciidoc',
    'aspectj',
    'autohotkey',
    'autoit',
    'avrasm',
    'awk',
    'axapta',
    'bash',
    'basic',
    'bnf',
    'brainfuck',
    'c',
    'cal',
    'capnproto',
    'ceylon',
    'clean',
    'clojure',
    'clojure-repl',
    'cmake',
    'coffeescript',
    'coq',
    'cos',
    'cpp',
    'crmsh',
    'crystal',
    'csharp',
    'csp',
    'css',
    'd',
    'markdown',
    'dart',
    'delphi',
    'diff',
    'django',
    'dns',
    'dockerfile',
    'dos',
    'dsconfig',
    'dts',
    'dust',
    'ebnf',
    'elixir',
    'elm',
    'ruby',
    'erb',
    'erlang-repl',
    'erlang',
    'excel',
    'fix',
    'flix',
    'fortran',
    'fsharp',
    'gams',
    'gauss',
    'gcode',
    'gherkin',
    'glsl',
    'gml',
    'go',
    'golo',
    'gradle',
    'graphql',
    'groovy',
    'haml',
    'handlebars',
    'haskell',
    'haxe',
    'hsp',
    'http',
    'hy',
    'inform7',
    'ini',
    'irpf90',
    'isbl',
    'java',
    'javascript',
    'jboss-cli',
    'json',
    'julia',
    'julia-repl',
    'kotlin',
    'lasso',
    'latex',
    'ldif',
    'leaf',
    'less',
    'lisp',
    'livecodeserver',
    'livescript',
    'llvm',
    'lsl',
    'lua',
    'makefile',
    'mathematica',
    'matlab',
    'maxima',
    'mel',
    'mercury',
    'mipsasm',
    'mizar',
    'perl',
    'mojolicious',
    'monkey',
    'moonscript',
    'n1ql',
    'nestedtext',
    'nginx',
    'nim',
    'nix',
    'node-repl',
    'nsis',
    'objectivec',
    'ocaml',
    'openscad',
    'oxygene',
    'parser3',
    'pf',
    'pgsql',
    'php',
    'php-template',
    'plaintext',
    'pony',
    'powershell',
    'processing',
    'profile',
    'prolog',
    'properties',
    'protobuf',
    'puppet',
    'purebasic',
    'python',
    'python-repl',
    'q',
    'qml',
    'r',
    'reasonml',
    'rib',
    'roboconf',
    'routeros',
    'rsl',
    'ruleslanguage',
    'rust',
    'sas',
    'scala',
    'scheme',
    'scilab',
    'scss',
    'shell',
    'smali',
    'smalltalk',
    'sml',
    'sqf',
    'sql',
    'stan',
    'stata',
    'step21',
    'stylus',
    'subunit',
    'swift',
    'taggerscript',
    'yaml',
    'tap',
    'tcl',
    'thrift',
    'tp',
    'twig',
    'typescript',
    'vala',
    'vbnet',
    'vbscript',
    'vbscript-html',
    'verilog',
    'vhdl',
    'vim',
    'wasm',
    'wren',
    'x86asm',
    'xl',
    'xquery',
    'zephir',
  ];

  createRenderRoot() {
    return this;
  }

  onLanguageClicked(language: string) {
    this.selectedLanguage = language;
    this.dispatchEvent(
      createEvent('selected-language-changed', {
        language: this.selectedLanguage ?? 'javascript',
      })
    );
    this.dispatchEvent(createEvent('dispose', null));
    this.filterText = '';
  }
  render() {
    const filteredLanguages = LangList.languages.filter(language => {
      // if (!this.filterText) {
      //   return false;
      // }
      return language.toLowerCase().startsWith(this.filterText.toLowerCase());
    });

    if (this.showLangList === 'hidden') {
      return html``;
    }

    return html`
      <div class="lang-list-container">
        <input
          id="filter-input"
          type="text"
          placeholder="Search"
          value=${this.filterText}
          @keyup=${() => (this.filterText = this.filterInput?.value)}
        />
        ${filteredLanguages.map(
          language => html`
            <code-block-button
              @click="${() => this.onLanguageClicked(language)}"
              class="lang-item"
            >
              ${language}
            </code-block-button>
          `
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lang-list': LangList;
  }

  interface HTMLElementEventMap {
    'selected-language-changed': CustomEvent<{ language: string }>;
    dispose: CustomEvent<null>;
  }
}
