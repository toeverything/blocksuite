import { customElement, property, state } from 'lit/decorators.js';
import { LitElement, html, css, unsafeCSS } from 'lit';
import { createEvent } from '../../__internal__';
import style from './style.css';
import { IconMap } from './icons';

@customElement('lang-list')
class LangList extends LitElement {
  static get styles() {
    return css`
      ${unsafeCSS(style)}
    `;
  }
  @property({ type: String })
  filterText = '';

  @property({ type: String })
  selectedLanguage = '';

  @property()
  showLangList = 'hidden';

  @state()
  disposeTimer = 0;

  @property()
  delay = 150;

  languages = [
    'C++',
    'Java',
    'Python',
    'JavaScript',
    'C#',
    'Swift',
    'Ruby',
    'Go',
    'Kotlin',
    'PHP',
    'Rust',
    'R',
    'Dart',
    'Elixir',
    'TypeScript',
    'Haskell',
    'Scala',
    'Julia',
    'Lua',
    'Crystal',
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
  }

  render() {
    const filteredLanguages = this.languages.filter(language => {
      // if (!this.filterText) {
      //   return false;
      // }
      return language.toLowerCase().startsWith(this.filterText.toLowerCase());
    });

    if (this.showLangList === 'hidden') {
      return html``;
    }

    return html`
      <div>
        ${filteredLanguages.map(
          language => html`
            <div
              @click="${() => this.onLanguageClicked(language)}"
              class="${this.selectedLanguage === language ? 'selected' : ''}"
            >
              ${IconMap.get(language) || IconMap.get('typescript')} ${language}
            </div>
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
