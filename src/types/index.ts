export interface Channel {
  id: string;
  name: string;
  logo: string;
  streamUrl: string;
  category: string;
  epg?: EPGProgram[];
}

export interface EPGProgram {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  genre: string;
}

export interface Category {
  id: string;
  name: string;
  channels: Channel[];
}