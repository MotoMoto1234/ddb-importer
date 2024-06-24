# D&D Beyond Importer

![Latest Release Download Count](https://img.shields.io/badge/dynamic/json?label=Downloads%20(Latest)&query=assets%5B0%5D.download_count&url=https%3A%2F%2Fapi.github.com%2Frepos%2FMrPrimate%2Fddb-importer%2Freleases%2Flatest)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fddb-importer&colorB=4aa94a)
![Foundry Minimum Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FMrPrimate%2Fddb-importer%2Fmain%2Fmodule-template.json&label=Foundry%20Version&query=$.compatibility.minimum&colorB=orange)
![Foundry Verified Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FMrPrimate%2Fddb-importer%2Fmain%2Fmodule-template.json&label=Foundry%20Version&query=$.compatibility.verified&colorB=green)

Integrate your dndbeyond.com characters into Foundry Virtual Tabletop.

This module:
* Import your DDB characters into Foundry, and sync changes back!
* Import a characters extras such as Wildshapes or beast companions.
* Import spells and items.
* Import Monsters and NPCs.
* [Patreon](https://patreon.com/mrprimate) supporters can sync limited character changes back to DDB.

In addition you can:

- Use the built in dictionary to get a large icon coverage during import.
- Use supplied SRD items where available.
- Choose to use matching SRD icons.
- Attempt to auto-generate effects for items.

## Video Tutorial

[Watch a video to get started here!](https://youtu.be/OMaJHLQORWo).

## Examples

### Import Things!

![](./docs/muncher.png)

### Update back to D&DBeyond

![](./docs/sync.png)

### Exclude Items from Update

![](./docs/exclude.png)

### Generate Roll Tables

![](./docs/confusion.png)

### Encounter Muncher

![](./docs/encounter-muncher.png)

### Compendium Folders Module Support

![](./docs/compendium-folders.png)


## What's the catch?

Calls to dndbeyond are proxied to provide authentication and to bypass CORS checks.

The proxy calls dndbeyond with your credentials to fetch your data.

To get all your spells and do bulk importing you need to set the Cobalt Cookie setting to the value of your D&DBeyond `CobaltSession` cookie. See my helper [Chrome extension](https://github.com/mrprimate/ddb-importer-chrome) to help.

Do **NOT** give your cookie to other people, this is like handing out a password to your dndbeyond account.

We do not store your cobalt cookie on the server.

To logout/invalidate these credentials log out of your D&DBeyond Session.

If you wish to host your own proxy, please see [ddb-proxy](https://github.com/mrprimate/ddb-proxy), help is not available for this mode, and not all functionality is available.

## Support

Where can you support me? See my [Patreon](https://patreon.com/mrprimate).

You can log bugs here, or mention them in the [Discord channel](https://discord.gg/WzPuRuDJVP).

## Pre-requisites and recommendations

There are NO pre-requisites for DDB Importer.

Below are some recommended modules.

I'd strongly recommend installing:

- [Magic Items](https://foundryvtt.com/packages/magicitems/) for attaching spells to magic items
- [Link Item and Resource DnD5e module](https://foundryvtt.com/packages/link-item-resource-5e ) for good resource linking (not needed if using the new 5e sheets in v3.0.0+)
- [Vision/Detection Modes 5e](https://foundryvtt.com/packages/vision-5e) adds those lovely missing vision modes for 5e.

If you want to add spell effects, and high levels of automation you will need, (this is not recommended if you're using Foundry for the first time):
- [DAE](https://foundryvtt.com/packages/dae/) for skill bonuses and basic effects
- [Midi-QOL](https://foundryvtt.com/packages/midi-qol/)
- [About Time](https://foundryvtt.com/packages/about-time)
- [Times Up](https://foundryvtt.com/packages/times-up/).

Several macros that impact tokens rely on:
- [Active Auras](https://foundryvtt.com/packages/ActiveAuras)
- [Active Token Effects](https://foundryvtt.com/packages/ATL)

For super high automation (this is not recommended if you're using Foundry for the first time):
- [Chris's Premades](https://foundryvtt.com/packages/chris-premades) includes a lot of more advanced effects, but has a lot of module dependencies.

For prettiness add:
- [Token Magic FX](https://foundryvtt.com/packages/tokenmagic).
- [Automated Animations](https://foundryvtt.com/packages/autoanimations)


## SRD Import Notes

Some detail will be lost:

* Any auto configuration of Magic Item spells
* Any custom damage modifications from things like Fighting Styles and Improved Divine Smite

Some details are updated, if applicable:

* number of uses
* quantity of items
* attuned status
* equipped status
* resource tracking
* spell preparation status
* proficiency


## Configuration

### Avatar upload directory

Sets the icon directory where you are storing your avatar image uploads. It's relative to the Foundry `/Data` directory, please do not add a leading or trailing slash to this path.

Examples:

- `img/uploads` references to `[Foundry]/Data/img/uploads`
- `uploads` references to `[Foundry]/Data/uploads`
- `` references to `[Foundry]/Data` - not recommended

# FAQ

See [FAQ!](./FAQ.md)


# Attributions

Some assets in this module are kindly provided by JB2A and are licensed by [Attribution-NonCommercial-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0).
You can find them under [img/jb2a](./img/jb2a)

Check them out at [https://jb2a.com](https://jb2a.com) they have a free and patreon supported Foundry modules providing wonderful animations and assets for a variety of situations.

You can learn more about their Foundry modules [here](https://jb2a.com/home/install-instructions/)
