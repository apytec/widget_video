import { React } from 'jimu-core';
import { AllWidgetSettingProps } from 'jimu-for-builder';
import { SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components';
import { Input, Radio, Label } from 'jimu-ui';
import { IMConfig } from '../config';

export default class Setting extends React.PureComponent<AllWidgetSettingProps<IMConfig>, {}> {
  onUrlChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const url = evt.target.value;
    this.props.onSettingChange({
      id: this.props.id,
      config: { ...this.props.config, url }
    });
  };

  onModeChange = (mode: 'video' | 'iframe') => {
    this.props.onSettingChange({
      id: this.props.id,
      config: { ...this.props.config, mode }
    });
  };

  render() {
    const { url, mode } = this.props.config;

    return (
      <SettingSection title="Embed Stream">
        <SettingRow label="URL de la fuente">
          <Input
            className="w-100"
            value={url}
            onChange={this.onUrlChange}
            placeholder="Ingresa la URL"
          />
        </SettingRow>

        <SettingRow label="Modo">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Radio
              checked={mode === 'video'}
              onChange={() => this.onModeChange('video')}
            />
            <Label>&nbsp;Video</Label>

            <Radio
              checked={mode === 'iframe'}
              onChange={() => this.onModeChange('iframe')}
              style={{ marginLeft: '1rem' }}
            />
            <Label>&nbsp;Iframe</Label>
          </div>
        </SettingRow>
      </SettingSection>
    );
  }
}
