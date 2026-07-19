/**
 * Block registry — maps __component string → React component.
 *
 * Decision #3: O(1) lookup map. Unknown __component values fall through to
 * null in BlockRenderer (REQ-N03). Add new block imports here as they are
 * implemented beyond the stub phase.
 */

import type { ComponentType } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlockComponent = ComponentType<any>;

import HeroLanding from "./blocks/HeroLanding";
import HeroPage from "./blocks/HeroPage";
import ArticleList from "./blocks/ArticleList";
import PhotoGallery from "./blocks/PhotoGallery";
import QuickLinks from "./blocks/QuickLinks";
import Timeline from "./blocks/Timeline";
import MissionVision from "./blocks/MissionVision";
import ProcessSteps from "./blocks/ProcessSteps";
import RichText from "./blocks/RichText";
import Cta from "./blocks/Cta";
import MapBlock from "./blocks/MapBlock";
import StaffSection from "./blocks/StaffSection";
import BulletList from "./blocks/BulletList";
import KeyDates from "./blocks/KeyDates";
import InfoCard from "./blocks/InfoCard";
import ClinicSchedule from "./blocks/ClinicSchedule";
import IconStrip from "./blocks/IconStrip";
import MapSchedule from "./blocks/MapSchedule";
import Section from "./blocks/Section";
import DynamicFormBlock from "./blocks/DynamicFormBlock";
import MagazineArchive from "./blocks/MagazineArchive";
import DocumentRepository from "./blocks/DocumentRepository";
import AccordionBlock from "./blocks/Accordion";
import TabsBlock from "./blocks/Tabs";
import CarouselBlock from "./blocks/Carousel";
import DataTable from "./blocks/DataTable";

export const blockRegistry: Record<string, BlockComponent> = {
  "blocks.hero-landing": HeroLanding,
  "blocks.hero-page": HeroPage,
  "blocks.article-list": ArticleList,
  "blocks.photo-gallery": PhotoGallery,
  "blocks.quick-links": QuickLinks,
  "blocks.timeline": Timeline,
  "blocks.mission-vision": MissionVision,
  "blocks.process-steps": ProcessSteps,
  "blocks.rich-text": RichText,
  "blocks.cta": Cta,
  "blocks.map": MapBlock,
  "blocks.staff-section": StaffSection,
  "blocks.bullet-list": BulletList,
  "blocks.key-dates": KeyDates,
  "blocks.info-card": InfoCard,
  "blocks.clinic-schedule": ClinicSchedule,
  "blocks.icon-strip": IconStrip,
  "blocks.map-schedule": MapSchedule,
  "blocks.section": Section,
  "blocks.form": DynamicFormBlock,
  "blocks.magazine-archive": MagazineArchive,
  "blocks.document-repository": DocumentRepository,
  "blocks.accordion": AccordionBlock,
  "blocks.tabs": TabsBlock,
  "blocks.carousel": CarouselBlock,
  "blocks.table": DataTable,
};
