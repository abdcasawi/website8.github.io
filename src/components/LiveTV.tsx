import React, { useState } from 'react';
import { Channel, Category } from '../types';
import { ChevronLeft, ChevronRight, Search, Grid, List } from 'lucide-react';

interface LiveTVProps {
  onChannelSelect: (channel: Channel) => void;
}

const LiveTV: React.FC<LiveTVProps> = ({ onChannelSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const buttonBackgroundStyle = {
    backgroundImage: 'url(/cinema.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  // Mock data for categories and channels
  const categories: Category[] = [
    {
      id: 'all',
      name: 'All Channels',
      channels: []
    },
    {
      id: 'General',
      name: 'General',
      channels: []
    },
    {
      id: 'Sports',
      name: 'Sports',
      channels: []
    },
    {
      id: 'NEWS',
      name: 'NEWS',
      channels: []
    },
    {
      id: 'MOROCCO',
      name: 'MOROCCO',
      channels: []
    },
    {
      id: 'ARABIC',
      name: 'ARABIC',
      channels: []
    },
    {
      id: 'RELIGIOUS',
      name: 'RELIGIOUS',
      channels: []
    },
    {
      id: 'ITALY',
      name: 'ITALY',
      channels: []
    },
    {
      id: 'MBC',
      name: 'MBC',
      channels: []
    },
    {
      id: 'RAI',
      name: 'RAI',
      channels: []
    },
  ];

  const channels: Channel[] = [
    {
      "id": "1",
      "name": "animal planet (1080p)",
      "logo": "https://i.imgur.com/FdXu8VB.png",
      "streamUrl": "https://nfsnew.newkso.ru/nfs/premium304/mono.m3u8",
      "category": "ARABIC"
    },
    {
      "id": "2",
      "name": "QURAN (1080p)",
      "logo": "https://i.imgur.com/FdXu8VB.png",
      "streamUrl": "https://5c7b683162943.streamlock.net/live/ngrp:bahrainquran_all/playlist.m3u8",
      "category": "ARABIC"
    },
    {
      "id": "3",
      "name": "2M Monde +1 (1080p)",
      "logo": "https://i.imgur.com/MvpntzA.png",
      "streamUrl": "https://d2qh3gh0k5vp3v.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-n6pess5lwbghr/2M_ES.m3u8",
      "category": "MOROCCO"
    },
    {
      "id": "13",
      "name": "Al Aoula Inter (480p)",
      "logo": "https://i.imgur.com/nq53d2N.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/ts_corp/73_aloula_w1dqfwm/playlist_dvr.m3u8",
      "category": "MOROCCO"
    },
    {
      "id": "14",
      "name": "Al Aoula Laâyoune (480p)",
      "logo": "https://www.snrt.ma/sites/default/files/2023-04/laayoune.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/abr_corp/73_laayoune_pgagr52/corp/73_laayoune_pgagr52_480p/chunks_dvr.m3u8",
      "category": "MOROCCO"
    },
    {
      "id": "15",
      "name": "Al Arabiya (1080p)",
      "logo": "https://i.imgur.com/NXFkYFj.png",
      "streamUrl": "https://live.alarabiya.net/alarabiapublish/alarabiya.smil/playlist.m3u8",
      "category": "NEWS"
    },
    {
      "id": "16",
      "name": "Al Arabiya Al Hadath (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/De4SEWE.png",
      "streamUrl": "https://av.alarabiya.net/alarabiapublish/alhadath.smil/playlist.m3u8",
      "category": "NEWS"
    },
    {
      "id": "17",
      "name": "Al Arabiya Business (1080p)",
      "logo": "https://i.imgur.com/eEV4r6J.jpg",
      "streamUrl": "https://live.alarabiya.net/alarabiapublish/aswaaq.smil/playlist.m3u8",
      "category": "NEWS"
    },
    {
      "id": "18",
      "name": "Al Arabiya Programs (1080p)",
      "logo": "https://i.imgur.com/Hoc3cfO.png",
      "streamUrl": "https://d1j4r34gq3qw9y.cloudfront.net/out/v1/96804f3a14864641a21c25e8ca9afb74/index.m3u8",
      "category": "NEWS"
    },
    {
      "id": "19",
      "name": "Al Araby TV 2 (1080p)",
      "logo": "https://i.imgur.com/Gp5mNea.png",
      "streamUrl": "https://alarabyta.cdn.octivid.com/alaraby2n/smil:alaraby2n.stream.smil/chunklist.m3u8",
      "category": "NEWS"
    },
    {
      "id": "20",
      "name": "Al Araby TV (1080p)",
      "logo": "https://i.imgur.com/YMqWEe4.png",
      "streamUrl": "https://alarabyta.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/chunklist.m3u8",
      "category": "ARABIC"
    },
    {
      "id": "22",
      "name": "Al Jazeera (1080p)",
      "logo": "https://i.imgur.com/7bRVpnu.png",
      "streamUrl": "https://live-hls-apps-aja-fa.getaj.net/AJA/index.m3u8",
      "category": "NEWS"
    },
    {
      "id": "24",
      "name": "Al Jazeera Mubasher 24 (1080p)",
      "logo": "https://yt3.googleusercontent.com/h0_bBdVgCAXIPJFnQ4hZtE87cDY_qO7rkDAue8qXdmOFxZ5NaO3AFD1uCUcst-EsBcGJ8zl8EQ=s160-c-k-c0x00ffffff-no-rj",
      "streamUrl": "https://live-hls-apps-ajm24-fa.getaj.net/AJM24/index.m3u8",
      "category": "NEWS"
    },
    {
      "id": "27",
      "name": "Al Maghribia (480p)",
      "logo": "https://i.imgur.com/7GaahYh.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/abr_corp/73_almaghribia_83tz85q/corp/73_almaghribia_83tz85q_480p/chunks_dvr.m3u8",
      "category": "MOROCCO"
    },
    {
      "id": "28",
      "name": "Al Qamar TV (1080p)",
      "logo": "https://i.imgur.com/zkBT0C8.png",
      "streamUrl": "https://streamer3.premio.link/alqamar/playlist.m3u8",
      "category": "ARABIC"
    },
    {
      "id": "32",
      "name": "Arryadia (480p)",
      "logo": "https://i.imgur.com/XjzK3gZ.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/abr_corp/73_arryadia_k2tgcj0/corp/73_arryadia_k2tgcj0_480p/chunks_dvr.m3u8",
      "category": "MOROCCO"
    },
    {
      "id": "33",
      "name": "Asharq Discovery (1080p) [Geo-blocked]",
      "logo": "https://i.imgur.com/CyS9r2n.png",
      "streamUrl": "https://svs.itworkscdn.net/asharqdiscoverylive/asharqd.smil/playlist_dvr.m3u8",
      "category": "ARABIC"
    },
    {
      "id": "34",
      "name": "Asharq Documentary (1080p)",
      "logo": "https://i.imgur.com/x8ELmhM.png",
      "streamUrl": "https://svs.itworkscdn.net/asharqdocumentarylive/asharqdocumentary.smil/playlist_dvr.m3u8",
      "category": "ARABIC"
    },
    {
      "id": "35",
      "name": "Assadissa (480p)",
      "logo": "https://i.imgur.com/un6qTGO.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/abr_corp/73_assadissa_7b7u5n1/corp/73_assadissa_7b7u5n1_480p/chunks_dvr.m3u8",
      "category": "MOROCCO"
    },
    {
      "id": "36",
      "name": "Athaqafia (480p)",
      "logo": "https://i.imgur.com/mrwFI2L.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/ts_corp/73_arrabia_hthcj4p/playlist_dvr.m3u8",
      "category": "MOROCCO"
    },
    {
      "id": "42",
      "name": "CGTN Arabic (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/AkFFrS7.png",
      "streamUrl": "https://arabic-livews.cgtn.com/hls/LSveq57bErWLinBnxosqjisZ220802LSTefTAS9zc9mpU08y3np9TH220802cd/playlist.m3u8",
      "category": "NEWS"
    },
    {
      "id": "43",
      "name": "Chada TV (720p)",
      "logo": "https://i.imgur.com/inJyJBN.png",
      "streamUrl": "https://chadatv.vedge.infomaniak.com/livecast/chadatv/playlist.m3u8",
      "category": "ARABIC"
    },
    {
      "id": "48",
      "name": "Dubai One (1080p)",
      "logo": "https://i.imgur.com/Dj16oKL.png",
      "streamUrl": "https://dminnvllta.cdn.mgmlcdn.com/dubaione/smil:dubaione.stream.smil/chunklist.m3u8",
      "category": "ARABIC"
    },
    {
      "id": "49",
      "name": "DW Arabic (1080p)",
      "logo": "https://i.imgur.com/8MRNFb9.png",
      "streamUrl": "https://dwamdstream103.akamaized.net/hls/live/2015526/dwstream103/index.m3u8",
      "category": "NEWS"
    },
    {
      "id": "56",
      "name": "MBC 1 (1080p)",
      "logo": "https://i.imgur.com/CiA3plN.png",
      "streamUrl": "https://d3o3cim6uzorb4.cloudfront.net/out/v1/0965e4d7deae49179172426cbfb3bc5e/index.m3u8",
      "category": "MBC"
    },
    {
      "id": "58",
      "name": "MBC 3 KSA (1080p)",
      "logo": "https://i.imgur.com/PVt8OPN.png",
      "streamUrl": "https://shls-mbc3-prod-dub.shahid.net/out/v1/d5bbe570e1514d3d9a142657d33d85e6/index.m3u8",
      "category": "MBC"
    },
    {
      "id": "59",
      "name": "MBC 4 (1080p)",
      "logo": "https://i.imgur.com/BcXASJp.png",
      "streamUrl": "https://shls-masr-prod-dub.shahid.net/out/v1/c08681f81775496ab4afa2bac7ae7638/index.m3u8",
      "category": "MBC"
    },
    {
      "id": "60",
      "name": "MBC 5 (1080p)",
      "logo": "https://i.imgur.com/fRWaDyF.png",
      "streamUrl": "",
      "category": "MBC"
    },
    {
      "id": "61",
      "name": "MBCDRAMA+ (1080p)",
      "logo": "https://i.imgur.com/Eld2t3I.png",
      "streamUrl": "https://shls-mbcplusdrama-prod-dub.shahid.net/out/v1/97ca0ce6fc6142f4b14c0a694af59eab/index.m3u8",
      "category": "MBC"
    },
    {
      "id": "63",
      "name": "MBC FM (1080p)",
      "logo": "https://i.imgur.com/lF8UxvR.png",
      "streamUrl": "https://dbbv9umqcd7cs.cloudfront.net/out/v1/db15b75c3cc0400c91961468d6a232ac/index.m3u8",
      "category": "MBC"
    },
    {
      "id": "65",
      "name": "Medi 1 TV Afrique (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/OioFepy.jpeg",
      "streamUrl": "https://streaming1.medi1tv.com/live/smil:medi1fr.smil/playlist.m3u8",
      "category": "MOROCCO"
    },
    {
      "id": "66",
      "name": "Medi 1 TV Arabic (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/jWKH922.jpeg",
      "streamUrl": "https://streaming1.medi1tv.com/live/smil:medi1ar.smil/playlist.m3u8",
      "category": "MOROCCO"
    },
    {
      "id": "67",
      "name": "Medi 1 TV Maghreb (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/LbeChWy.jpeg",
      "streamUrl": "https://streaming1.medi1tv.com/live/smil:medi1tv.smil/playlist.m3u8",
      "category": "MOROCCO"
    },
    {
      "id": "75",
      "name": "Rai Italia",
      "logo": "https://i.imgur.com/1nN4rEP.png",
      "streamUrl": "https://ilglobotv-live.akamaized.net/channels/RAIItaliaSudAfrica/Live.m3u8",
      "category": "ITALY"
    },
    {
      "id": "79",
      "name": "RT Arabic (1080p) [Geo-blocked]",
      "logo": "https://i.imgur.com/G8vGrn1.png",
      "streamUrl": "https://rt-arb.rttv.com/dvr/rtarab/playlist.m3u8",
      "category": "ARABIC"
    },
    {
      "id": "81",
      "name": "Sky News Arabia (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/SvjU4h6.png",
      "streamUrl": "https://stream.skynewsarabia.com/ott/ott.m3u8",
      "category": "News"
    },
    {
      "id": "82",
      "name": "Sky News Arabia (Portrait) (1280p) [Not 24/7]",
      "logo": "https://i.imgur.com/FjtzQQs.png",
      "streamUrl": "https://stream.skynewsarabia.com/vertical/vertical.m3u8",
      "category": "NEWS"
    },
    {
      "id": "85",
      "name": "Tamazight TV (480p)",
      "logo": "https://i.imgur.com/fm6S7we.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/ts_corp/73_tamazight_tccybxt/playlist_dvr.m3u8",
      "category": "MOROCCO"
    },
    {
        "id": "87",
        "name": "Giallo",
        "logo": "https://i.imgur.com/jmogelp.png",
        "streamUrl": "https://amg16146-wbdi-amg16146c5-samsung-it-1838.playouts.now.amagi.tv/playlist/amg16146-warnerbrosdiscoveryitalia-giallo-samsungit/playlist.m3u8",
        "category": "ITALY"
    },
    {
        "id": "88",
        "name": "Real Time",
        "logo": "https://i.imgur.com/EuvIaWN.png",
        "streamUrl": "https://amg16146-wbdi-amg16146c2-samsung-it-1835.playouts.now.amagi.tv/playlist/amg16146-warnerbrosdiscoveryitalia-realtime-samsungit/playlist.m3u8",
        "category": "ITALY"
    },
    {
        "id": "89",
        "name": "Sky TG24",
        "logo": "https://i.imgur.com/GF8PBkV.png",
        "streamUrl": "https://hlslive-web-gcdn-skycdn-it.akamaized.net/TACT/12221/web/master.m3u8?hdnts=st=1701861650~exp=1765449000~acl=/*~hmac=84c9f3f71e57b13c3a67afa8b29a8591ea9ed84bf786524399545d94be1ec04d",
        "category": "ITALY"
    },
    {
        "id": "90",
        "name": "DMAX",
        "logo": "https://i.imgur.com/ganRfEo.png",
        "streamUrl": "https://amg16146-wbdi-amg16146c8-samsung-it-1841.playouts.now.amagi.tv/playlist/amg16146-warnerbrosdiscoveryitalia-dmax-samsungit/playlist.m3u8",
        "category": "ITALY"
    },
    {
        "id": "91",
        "name": "France 24 Arabic",
        "logo": "https://i.imgur.com/Wlasx7Q.png",
        "streamUrl": "https://live.france24.com/hls/live/2037222-b/F24_AR_HI_HLS/master_5000.m3u8",
        "category": "NEWS"
    },
    {
        "id": "92",
        "name": "HGTV - Home&Garden",
        "logo": "https://i.imgur.com/f3Jn8ON.png",
        "streamUrl": "https://amg16146-wbdi-amg16146c9-samsung-it-1842.playouts.now.amagi.tv/playlist/amg16146-warnerbrosdiscoveryitalia-hgtv-samsungit/playlist.m3u8",
        "category": "ARABIC"
    },
    {
        "id": "93",
        "name": "L'Equipe Live 1",
        "logo": "https://i.imgur.com/U8fIwyQ.png",
        "streamUrl": "https://d3awaj0f2u3w26.cloudfront.net/4/media.m3u8",
        "category": "FRANCE"
    },
    {
        "id": "95",
        "name": "L'Equipe Live 2",
        "logo": "https://i.imgur.com/U8fIwyQ.png",
        "streamUrl": "https://d2l55nvfkhk4sg.cloudfront.net/4/media.m3u8",
        "category": "FRANCE"
    },
    {
        "id": "94",
        "name": "RMC Découverte ",
        "logo": "https://i.imgur.com/fRxPRBv.png",
        "streamUrl": "https://d2mt8for1pddy4.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-6uronj7gzvy4j/index.m3u8",
        "category": "FRANCE"
    },
    {
        "id": "96",
        "name": "Rai News 24",
        "logo": "https://i.imgur.com/KWteU9B.png",
        "streamUrl": "https://ilglobotv-live.akamaized.net/channels/RAINews24/Live.m3u8",
        "category": "ITALY"
    },
    {
      "id": "97",
      "name": "Rai 1",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/rai1.png",
      "streamUrl": "https://dash2.antik.sk/live/test_rai_uno_tizen/playlist.m3u8",
      "category": "RAI"
    },
    {
      "id": "98",
      "name": "natgeowild",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/rai2.png",
      "http://mag.ukhd.tv:80/play/live.php?mac=00:1A:79:BB:EE:72&stream=42675&extension=m3u8": "RAI"
    },
    {
      "id": "99",
      "name": "Rai 3",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/rai3.png",
      "streamUrl": "https://wzstreaming.rai.it/TVlive/liveStream/playlist.m3u8",
      "category": "RAI"
    },
    {
      "id": "100",
      "name": "Rete 4",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/rete4.png",
      "streamUrl": "https://live03-col.msf.cdn.mediaset.net/live/ch-r4/r4-clr.isml/manifest.mpd",
      "category": "Mediaset"
    },
    {
      "id": "101",
      "name": "Canale 5",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/canale5.png",
      "streamUrl": "https://live03-col.msf.cdn.mediaset.net/live/ch-c5/c5-clr.isml/manifest.mpd",
      "category": "Mediaset"
    },
    {
      "id": "102",
      "name": "Italia 1",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/italia1.png",
      "streamUrl": "https://live03-col.msf.cdn.mediaset.net/live/ch-i1/i1-clr.isml/manifest.mpd",
      "category": "Mediaset"
    },
    {
      "id": "7",
      "name": "LA7",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/la7.png",
      "streamUrl": "https://d3749synfikwkv.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-74ylxpgd78bpb/Live.m3u8",
      "category": "Altro"
    },
    {
      "id": "8",
      "name": "TV8",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/tv8.png",
      "streamUrl": "https://hlslive-web-gcdn-skycdn-it.akamaized.net/TACT/11223/tv8web/master.m3u8?hdnea=st=1701861650~exp=1765449000~acl=/*~hmac=84c9f3f71e57b13c3a67afa8b29a8591ea9ed84bf786524399545d94be1ec04d",
      "category": "Sky"
    },
    {
      "id": "9",
      "name": "NOVE",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/nove.png",
      "streamUrl": "https://amg16146-wbdi-amg16146c1-samsung-it-1831.playouts.now.amagi.tv/playlist/amg16146-warnerbrosdiscoveryitalia-nove-samsungit/playlist.m3u8",
      "category": "Discovery"
    },
    {
      "id": "20",
      "name": "20 Mediaset",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/20mediaset.png",
      "streamUrl": "https://live03-col.msf.cdn.mediaset.net/live/ch-lb/lb-clr.isml/manifest.mpd",
      "category": "Mediaset"
    },
    {
      "id": "21",
      "name": "Rai 4",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/rai4.png",
      "streamUrl": "http://mediapolis.rai.it/relinker/relinkerServlet.htm?cont=746966&output=7&forceUserAgent=raiplayappletv",
      "category": "RAI"
    },
    {
      "id": "22",
      "name": "Iris",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/iris.png",
      "streamUrl": "https://live03-col.msf.cdn.mediaset.net/live/ch-ki/ki-clr.isml/manifest.mpd",
      "category": "Mediaset"
    },
    {
      "id": "23",
      "name": "Rai 5",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/rai5.png",
      "streamUrl": "http://mediapolis.rai.it/relinker/relinkerServlet.htm?cont=395276&output=7&forceUserAgent=raiplayappletv",
      "category": "RAI"
    },
    {
      "id": "24",
      "name": "Rai Movie",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/raimovie.png",
      "streamUrl": "http://mediapolis.rai.it/relinker/relinkerServlet.htm?cont=747002&output=7&forceUserAgent=raiplayappletv",
      "category": "RAI"
    },
    {
      "id": "25",
      "name": "Rai Premium",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/raipremium.png",
      "streamUrl": "http://mediapolis.rai.it/relinker/relinkerServlet.htm?cont=746992&output=7&forceUserAgent=raiplayappletv",
      "category": "RAI"
    },
    {
      "id": "26",
      "name": "Cielo",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/cielo.png",
      "streamUrl": "https://hlslive-web-gcdn-skycdn-it.akamaized.net/TACT/11219/cieloweb/master.m3u8?hdnea=st=1701861650~exp=1765449000~acl=/*~hmac=84c9f3f71e57b13c3a67afa8b29a8591ea9ed84bf786524399545d94be1ec04d",
      "category": "Sky"
    },
    {
      "id": "27",
      "name": "Twenty Seven",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/twentyseven.png",
      "streamUrl": "https://live03-col.msf.cdn.mediaset.net/live/ch-ts/ts-clr.isml/manifest.mpd",
      "category": "Mediaset"
    },
    {
      "id": "28",
      "name": "TV2000",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/tv2000.png",
      "streamUrl": "https://hls-live-tv2000.akamaized.net/hls/live/2028510/tv2000/master.m3u8",
      "category": "Altro"
    },
    {
      "id": "29",
      "name": "LA7d",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/la7d.png",
      "streamUrl": "https://d15umi5iaezxgx.cloudfront.net/LA7D/CLN/HLS/Live.m3u8",
      "category": "Altro"
    },
    {
      "id": "30",
      "name": "La 5",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/la5.png",
      "streamUrl": "https://live03-col.msf.cdn.mediaset.net/live/ch-ka/ka-clr.isml/manifest.mpd",
      "category": "Mediaset"
    },
    {
      "id": "31",
      "name": "Real Time",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/realtime.png",
      "streamUrl": "https://amg16146-wbdi-amg16146c2-samsung-it-1835.playouts.now.amagi.tv/playlist/amg16146-warnerbrosdiscoveryitalia-realtime-samsungit/playlist.m3u8",
      "category": "Discovery"
    },
    {
      "id": "32",
      "name": "QVC",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/qvc.png",
      "streamUrl": "https://qrg.akamaized.net/hls/live/2017383/lsqvc1it/master.m3u8",
      "category": "Altro"
    },
    {
      "id": "33",
      "name": "Food Network",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/foodnetwork.png",
      "streamUrl": "https://amg16146-wbdi-amg16146c3-samsung-it-1836.playouts.now.amagi.tv/playlist/amg16146-warnerbrosdiscoveryitalia-foodnetwork-samsungit/playlist.m3u8",
      "category": "Discovery"
    },
    {
      "id": "34",
      "name": "Cine34",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/cine34.png",
      "streamUrl": "https://live03-col.msf.cdn.mediaset.net/live/ch-b6/b6-clr.isml/manifest.mpd",
      "category": "Mediaset"
    },
    {
      "id": "35",
      "name": "FOCUS",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/focus.png",
      "streamUrl": "https://live03-col.msf.cdn.mediaset.net/live/ch-fu/fu-clr.isml/manifest.mpd",
      "category": "Mediaset"
    },
    {
      "id": "36",
      "name": "RTL 102.5",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/rtl1025tv.png",
      "streamUrl": "https://dd782ed59e2a4e86aabf6fc508674b59.msvdn.net/live/S97044836/tbbP8T1ZRPBL/playlist_video.m3u8",
      "category": "Radio"
    },
    {
      "id": "37",
      "name": "Warner TV",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/warnertv.png",
      "streamUrl": "https://amg16146-wbdi-amg16146c4-samsung-it-1837.playouts.now.amagi.tv/playlist/amg16146-warnerbrosdiscoveryitalia-warnertv-samsungit/playlist.m3u8",
      "category": "Discovery"
    },
    {
      "id": "38",
      "name": "Giallo",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/giallo.png",
      "streamUrl": "https://amg16146-wbdi-amg16146c5-samsung-it-1838.playouts.now.amagi.tv/playlist/amg16146-warnerbrosdiscoveryitalia-giallo-samsungit/playlist.m3u8",
      "category": "Discovery"
    },
    {
      "id": "39",
      "name": "Top Crime",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/topcrime.png",
      "streamUrl": "https://live03-col.msf.cdn.mediaset.net/live/ch-lt/lt-clr.isml/manifest.mpd",
      "category": "Mediaset"
    },
    {
      "id": "40",
      "name": "Boing",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/boing.png",
      "streamUrl": "https://live03-col.msf.cdn.mediaset.net/live/ch-kb/kb-clr.isml/manifest.mpd",
      "category": "Mediaset"
    },
    {
      "id": "41",
      "name": "K2",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/k2.png",
      "streamUrl": "https://amg16146-wbdi-amg16146c6-samsung-it-1839.playouts.now.amagi.tv/playlist/amg16146-warnerbrosdiscoveryitalia-k2-samsungit/playlist.m3u8",
      "category": "Discovery"
    },
    {
      "id": "42",
      "name": "Rai Gulp",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/raigulp.png",
      "streamUrl": "http://mediapolis.rai.it/relinker/relinkerServlet.htm?cont=746953&output=7&forceUserAgent=raiplayappletv",
      "category": "RAI"
    },
    {
      "id": "43",
      "name": "Rai Yoyo",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/raiyoyo.png",
      "streamUrl": "http://mediapolis.rai.it/relinker/relinkerServlet.htm?cont=746899&output=7&forceUserAgent=raiplayappletv",
      "category": "RAI"
    },
    {
      "id": "44",
      "name": "Frisbee",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/frisbee.png",
      "streamUrl": "https://amg16146-wbdi-amg16146c7-samsung-it-1840.playouts.now.amagi.tv/playlist/amg16146-warnerbrosdiscoveryitalia-frisbee-samsungit/playlist.m3u8",
      "category": "Discovery"
    },
    {
      "id": "46",
      "name": "Cartoonito",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/cartoonito.png",
      "streamUrl": "https://live03-col.msf.cdn.mediaset.net/live/ch-la/la-clr.isml/manifest.mpd",
      "category": "Mediaset"
    },
    {
      "id": "47",
      "name": "Super!",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/super.png",
      "streamUrl": "https://vimnitaly.akamaized.net/hls/live/2094034/super/master.m3u8",
      "category": "Altro"
    },
    {
      "id": "48",
      "name": "Rai News 24",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/rainews24.png",
      "streamUrl": "http://mediapolis.rai.it/relinker/relinkerServlet.htm?cont=1&output=7&forceUserAgent=raiplayappletv",
      "category": "RAI"
    },
    {
      "id": "49",
      "name": "Italia 2",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/italia2.png",
      "streamUrl": "https://live03-col.msf.cdn.mediaset.net/live/ch-i2/i2-clr.isml/manifest.mpd",
      "category": "Mediaset"
    },
    {
      "id": "50",
      "name": "Sky TG24",
      "logo": "https://cdn.jsdelivr.net/gh/Tundrak/IPTV-Italia/logos/skytg24.png",
      "streamUrl": "https://hlslive-web-gcdn-skycdn-it.akamaized.net/TACT/12221/web/master.m3u8?hdnts=st=1701861650~exp=1765449000~acl=/*~hmac=84c9f3f71e57b13c3a67afa8b29a8591ea9ed84bf786524399545d94be1ec04d",
      "category": "Sky"
    },
    ];

  const filteredChannels = channels.filter(channel => {
    const matchesCategory = selectedCategory === 'all' || channel.category === selectedCategory;
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-white drop-shadow-lg">Live TV</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-black/20 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none w-64 placeholder-slate-400"
            />
          </div>
          <div 
            className="flex rounded-lg p-1 border border-white/20 relative overflow-hidden"
            style={buttonBackgroundStyle}
          >
            <div className="absolute inset-0 bg-black/40"></div>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors relative z-10 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors relative z-10 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border relative overflow-hidden ${
              selectedCategory === category.id
                ? 'border-blue-500 text-white'
                : 'border-white/20 text-slate-300 hover:text-white'
            }`}
            style={buttonBackgroundStyle}
          >
            <div className={`absolute inset-0 ${selectedCategory === category.id ? 'bg-blue-600/80' : 'bg-black/40 hover:bg-black/30'}`}></div>
            <span className="relative z-10">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Channels */}
      <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4' : 'space-y-2'}`}>
        {filteredChannels.map((channel) => (
          <div
            key={channel.id}
            onClick={() => onChannelSelect(channel)}
            className={`
              cursor-pointer transition-all duration-200 hover:scale-105 group border border-white/20 relative overflow-hidden
              ${viewMode === 'grid' 
                ? 'rounded-lg p-4 hover:shadow-lg' 
                : 'rounded-lg p-3 hover:shadow-lg flex items-center gap-3'
              }
            `}
            style={buttonBackgroundStyle}
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
            <div className={`relative z-10 ${viewMode === 'grid' ? 'text-center' : 'flex items-center gap-3 w-full'}`}>
              <div className={`${viewMode === 'grid' ? 'mb-3' : 'flex-shrink-0'}`}>
                <div className={`${viewMode === 'grid' ? 'w-16 h-16' : 'w-12 h-12'} rounded-lg overflow-hidden mx-auto shadow-lg bg-white/10 flex items-center justify-center`}>
                  <img 
                    src={channel.logo} 
                    alt={channel.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-text')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'fallback-text w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg';
                        fallback.textContent = channel.name.charAt(0);
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
              </div>
              <div className={`${viewMode === 'grid' ? 'text-center' : 'flex-1'}`}>
                <h3 className={`${viewMode === 'grid' ? 'text-sm' : 'text-base'} font-medium text-white group-hover:text-blue-400 transition-colors drop-shadow-lg`}>
                  {channel.name}
                </h3>
                {viewMode === 'list' && (
                  <p className="text-xs text-slate-400 capitalize">{channel.category}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredChannels.length === 0 && (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg drop-shadow-lg">No channels found</p>
        </div>
      )}
    </div>
  );
};

export default LiveTV;