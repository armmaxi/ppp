import ppp from '../../ppp.js';
import { TAG } from '../../lib/tag.js';
import { html, css, ref } from '../../vendor/fast-element.min.js';
import { validate } from '../../lib/ppp-errors.js';
import { Page, pageStyles } from '../page.js';
import '../button.js';
import '../text-field.js';

export const importKeysModalPageTemplate = html`
  <template class="${(x) => x.generateClasses()}">
    <ppp-loader></ppp-loader>
    <form novalidate>
      <section>
        <div class="label-group">
          <h5>Мастер-пароль</h5>
          <p class="description">Задавался при первой настройке приложения.</p>
        </div>
        <div class="input-group">
          <ppp-text-field
            type="password"
            value="${() => ppp.keyVault.getKey('master-password') ?? ''}"
            placeholder="Введите пароль"
            ${ref('masterPasswordForImport')}
          ></ppp-text-field>
        </div>
      </section>
      <section>
        <div class="label-group">
          <h5>Компактное представление</h5>
          <p class="description">
            Формат Base64. Скопируйте из настроенного ранее приложения.
          </p>
        </div>
        <div class="input-group">
          <ppp-text-field
            placeholder="Вставьте представление"
            ${ref('cloudCredentialsData')}
          ></ppp-text-field>
        </div>
      </section>
      <footer>
        <ppp-button
          type="submit"
          appearance="primary"
          @click="${(x) => x.submitDocument()}"
        >
          Импортировать ключи
        </ppp-button>
      </footer>
    </form>
  </template>
`;

export const importKeysModalPageStyles = css`
  ${pageStyles}
`;

export class importKeysModalPage extends Page {
  async submitDocument() {
    this.beginOperation();

    try {
      await validate(this.masterPasswordForImport);
      await validate(this.cloudCredentialsData);

      const { iv, data } = JSON.parse(
        atob(this.cloudCredentialsData.value.trim())
      );

      ppp.crypto.resetKey();

      const decryptedCredentials = JSON.parse(
        await ppp.crypto.decrypt(
          iv,
          data,
          this.masterPasswordForImport.value.trim()
        )
      );

      ppp.keyVault.setKey(
        'master-password',
        this.masterPasswordForImport.value.trim()
      );

      Object.keys(decryptedCredentials).forEach((k) => {
        ppp.keyVault.setKey(k, decryptedCredentials[k]);
      });

      if (+TAG > +decryptedCredentials.tag) {
        this.showSuccessNotification(
          'Импортированные ключи устарели. Обновите страницу и введите их заново. Затем настройте облачные функции и триггеры.'
        );
      } else {
        this.showSuccessNotification(
          'Всё в порядке. Обновите страницу, чтобы пользоваться приложением.'
        );
      }
    } catch (e) {
      this.failOperation(e);
    } finally {
      this.endOperation();
    }
  }
}

export default importKeysModalPage
  .compose({
    template: importKeysModalPageTemplate,
    styles: importKeysModalPageStyles
  })
  .define();
