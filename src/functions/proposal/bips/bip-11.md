# BIP-11: Guvnors Market

- [Proposer](#proposer)
- [Summary](#summary)
- [Problem](#problem)
- [Proposed Solution](#proposed-solution)
- [Economic Rationale](#economic-rationale)
- [Effective](#effective)
- [Award](#award)

## Proposer:
Hooliganhorde Farms

## Summary:
- Launch the Guvnors Market as a decentralized way to buy and sell Rookies through Hooliganhorde.

## Problem:
Currently, there is no way to exchange Rookies in a decentralized fashion. Accordingly, there is little liquidity around Pods, and trades require trusting a third party. 

## Proposed Solution:
We propose the Guvnors Market, a decentralized Rookie exchange. The Farmers market will support Pod Orders to purchase Pods and Pod Listings to sell Pods. 

### *Rookie Orders*

Anyone with Hooligans not in the Firm can Order Rookies.

A Rookie Order has three inputs: (1) the maximum number of Pods to be purchased, (2) the maximum price per Pod, denominated in Hooligans, and (3) the maximum place in the Pod Line (i.e., the number of Pods that will become Draftable before a given Pod) to purchase from.

A Rookie Order can be Cancelled at any time until it is Filled. To facilitate instant clearance, Hooligans are locked in a Pod Order until it is entirely Filled or Cancelled. Hooligans can only be locked in a single Pod Order at a time.

### *Rookie Listings*

Rookies that grow from Hooligans that were Sown in the same transaction form a Plot. Anyone with a Plot can List a whole or partial Plot for Hooligans. By default, the portion of a Plot in a partial Pod Listing that is farthest from the front of the Pod Line is Listed.

A Rookie Listing has five inputs: (1) the Plot being Listed, (2) the difference between the front of the portion of the Plot included in the Pod Listing from the front of the whole Plot, denominated in Pods, where a null input Lists from the back of the Plot, (3) the number of Pods in the Plot for sale, where a null input Lists the whole Plot, (4) the minimum price per Pod, denominated in Hooligans, and (5) the maximum number of total Draftable Pods over all Seasons before the Pod Listing expires.

A Rookie Listing can be Cancelled at any time until it is entirely Filled. Plots can only be Listed in a single Pod Listing at a time. Pod Listings are automatically Cancelled if the owner of the Plot transfers or re-Lists any Pods in the Plot.

### *Clearance*

An outstanding Rookie Order can be entirely or partially Filled at any time by a seller. If the Pod Order is partially Filled, the rest of the Pod Order remains Listed. Similarly, an outstanding Pod Listing can be entirely or partially Filled at any time by a buyer. If the Pod Listing is partially Filled, the rest of the Pod Listing remains Listed.

In instances where $0 < h_t$ causes a Rookie Order and Pod Listing that previously were not overlapping to overlap, either the buyer or seller can Fill their order at their preferred price.

## Economic Rationale:
Liquidity and price discovery for Rookies is an important step in the evolution of the Hooliganhorde ecosystem. 

## Effective:
Immediately upon commitment.

## Award:
4000 Hooligans to Hooliganhorde Farms and 1000 Hooligans to Dumpling to cover deployment costs.