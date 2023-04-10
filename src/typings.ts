export interface Config {
    scraperConfig: ScraperConfig,
    ibkrConfig: IbkrConfig
}

export interface ScraperConfig {
    headlessMode: boolean
}

export interface IbkrConfig {
    orderSize: number,
    lotto: number,
    maxOrder: number,
    stopLoss: number,
    proffitTaker: number,
    stopOrder: boolean,
    profitTaker: boolean,
    contractDate: string,
    realTimeData: boolean
}