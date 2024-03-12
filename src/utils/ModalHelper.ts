/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ModalHelper.ts                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: alle.roy <alle.roy.student@42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/01/04 21:43:21 by NebraskyThe       #+#    #+#             */
/*   Updated: 2023/02/04 20:20:24 by alle.roy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import Riniya from "@fluffici.ts";
import { Modal, SelectMenuComponent, TextInputComponent, showModal } from "discord-modals";
import { Interaction } from "discord.js";

export default class ModalHelper {
    private readonly modal: Modal;

    public constructor(customId: string, title: string) {
        this.modal = new Modal();
        this.modal.setCustomId(customId);
        this.modal.setTitle(title);
    }

    public addTextInput(component: TextInputComponent): ModalHelper {
        this.modal.addComponents(component);
        return this;
    }

    public addSelectMenu(component: SelectMenuComponent): ModalHelper {
        this.modal.addComponents(component);
        return this;
    }

    public generate(inter: Interaction<"cached">): Promise<Modal> {
        return showModal(this.modal, {
            client: Riniya.instance,
            interaction: inter
        });
    }

    public toModal(): Modal {
        return this.modal
    }
}
