export interface Config {
  scraperConfig: ScraperConfig;
  ibkrConfig: IbkrConfig;
}

export interface ScraperConfig {
  headlessMode: boolean;
}

export interface IbkrConfig {
  orderSize: number;
  orderSizeSpx: number;
  lotto: number;
  maxOrder: number;
  stopLoss: number;
  stopLossSpx: number;
  proffitTaker: number;
  proffitTakerSpx: number;
  stopOrder: boolean;
  profitTaker: boolean;
  contractDate: string;
  realTimeData: boolean;
  trailingStop: boolean;
  adjustedTrailingAmount: number;
}
